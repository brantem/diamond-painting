package reducer

import (
	"image"
	"image/color"
	"math"
	"math/rand"
	"runtime"
	"sync"
)

type Reducer struct {
	max int
}

func New(max int) *Reducer {
	return &Reducer{max: max}
}

func (r *Reducer) Do(img image.Image) (*image.Paletted, map[color.Color]int) {
	uniqueColors := unique(extractColors(img))

	var palette color.Palette
	if len(uniqueColors) <= r.max {
		palette = paletteFromUnique(uniqueColors)
	} else {
		palette = kMeansPalette(uniqueColors, r.max)
	}

	return createPalettedImage(img, palette)
}

func extractColors(img image.Image) [][3]uint8 {
	bounds := img.Bounds()
	colors := make([][3]uint8, bounds.Dx()*bounds.Dy())

	numRoutines := runtime.NumCPU()
	rowsPerRoutine := bounds.Dy() / numRoutines

	var wg sync.WaitGroup
	for i := 0; i < numRoutines; i++ {
		wg.Add(1)
		go func(start int) {
			defer wg.Done()
			for y := start; y < start+rowsPerRoutine && y < bounds.Max.Y; y++ {
				for x := bounds.Min.X; x < bounds.Max.X; x++ {
					r, g, b, _ := img.At(x, y).RGBA()
					colors[(y-bounds.Min.Y)*bounds.Dx()+(x-bounds.Min.X)] = [3]uint8{uint8(r >> 8), uint8(g >> 8), uint8(b >> 8)}
				}
			}
		}(i * rowsPerRoutine)
	}
	wg.Wait()

	return colors
}

func unique(colors [][3]uint8) [][3]uint8 {
	uniqueColors := make(map[[3]uint8]struct{}, len(colors))
	for _, c := range colors {
		uniqueColors[c] = struct{}{}
	}

	result := make([][3]uint8, 0, len(uniqueColors))
	for c := range uniqueColors {
		result = append(result, c)
	}
	return result
}

func paletteFromUnique(uniqueColors [][3]uint8) color.Palette {
	palette := make(color.Palette, len(uniqueColors))
	for i, c := range uniqueColors {
		palette[i] = color.RGBA{c[0], c[1], c[2], 255}
	}
	return palette
}

// kMeansPalette generates a palette using the k-means clustering algorithm. Thanks claude.ai
func kMeansPalette(colors [][3]uint8, maxClusters int) color.Palette {
	if len(colors) <= maxClusters {
		return paletteFromUnique(colors)
	}

	clusters := make([][3]uint8, maxClusters)
	for i := range clusters {
		clusters[i] = colors[rand.Intn(len(colors))]
	}

	assignments := make([]int, len(colors))
	prevAssignments := make([]int, len(colors))

	for iter := 0; iter < 10; iter++ {
		converged := true

		// assign each color to the closest cluster
		for i, c := range colors {
			assignments[i] = closestCluster(c, clusters)
			if assignments[i] != prevAssignments[i] {
				converged = false
				prevAssignments[i] = assignments[i] // track changes
			}
		}

		// stop if no colors changed clusters
		if converged {
			break
		}

		// recalculate cluster centers
		clusterSums := make([][3]int, maxClusters)
		clusterCounts := make(map[int]int, maxClusters)

		for i, clusterIdx := range assignments {
			clusterSums[clusterIdx][0] += int(colors[i][0])
			clusterSums[clusterIdx][1] += int(colors[i][1])
			clusterSums[clusterIdx][2] += int(colors[i][2])
			clusterCounts[clusterIdx]++
		}

		// update cluster centers based on the average color
		for i := range clusters {
			if count, ok := clusterCounts[i]; ok && count > 0 {
				clusters[i][0] = uint8(clusterSums[i][0] / count)
				clusters[i][1] = uint8(clusterSums[i][1] / count)
				clusters[i][2] = uint8(clusterSums[i][2] / count)
			}
		}
	}

	palette := make(color.Palette, maxClusters)
	for i, c := range clusters {
		palette[i] = color.RGBA{c[0], c[1], c[2], 255}
	}
	return palette
}

func closestCluster(color [3]uint8, clusters [][3]uint8) int {
	closest := 0
	minDist := math.MaxFloat64
	for i, c := range clusters {
		dist := manhattanDistance(color, c)
		if dist < minDist {
			minDist = dist
			closest = i
		}
	}
	return closest
}

func manhattanDistance(c1, c2 [3]uint8) float64 {
	return math.Abs(float64(c1[0])-float64(c2[0])) + math.Abs(float64(c1[1])-float64(c2[1])) + math.Abs(float64(c1[2])-float64(c2[2]))
}

func createPalettedImage(img image.Image, palette color.Palette) (*image.Paletted, map[color.Color]int) {
	bounds := img.Bounds()

	output := image.NewPaletted(bounds, palette)
	colors := make(map[color.Color]int, len(palette))

	// Map each pixel to the closest color in the palette
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			color := palette.Convert(img.At(x, y))
			output.Set(x, y, color)
			colors[color]++
		}
	}
	return output, colors
}
