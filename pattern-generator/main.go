package main

import (
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"os"
	"sort"
	"sync"
)

func findClosestColor(c color.RGBA, palette []color.RGBA) color.RGBA {
	var closestColor color.RGBA
	minDistance := uint32(1<<32 - 1)

	cr, cg, cb := uint32(c.R), uint32(c.G), uint32(c.B)
	for i := 0; i < len(palette); i++ {
		v := palette[i]
		dr := cr - uint32(v.R)
		dg := cg - uint32(v.G)
		db := cb - uint32(v.B)

		distance := dr*dr + dg*dg + db*db
		if distance < minDistance {
			minDistance = distance
			closestColor = v
		}

		if distance == 0 {
			return v
		}
	}

	return closestColor
}

type Color struct {
	Value color.RGBA
	Count int
}

func createPattern(img image.Image, size int, maxColors int) [][]color.RGBA {
	bounds := img.Bounds()

	aspectRatio := float64(bounds.Dx()) / float64(bounds.Dy())
	w := size
	h := int(float64(size) / aspectRatio)

	_colors := make(map[color.RGBA]int)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			c := color.RGBA{uint8(r >> 8), uint8(g >> 8), uint8(b >> 8), 255}
			_colors[c]++
		}
	}

	colors := make([]Color, 0, len(_colors))
	for color, count := range _colors {
		colors = append(colors, Color{color, count})
	}

	sort.Slice(colors, func(i, j int) bool {
		return colors[i].Count > colors[j].Count
	})

	n := maxColors
	if v := len(colors); v < n {
		n = v
	}
	pallete := make([]color.RGBA, n)
	for i := range pallete {
		pallete[i] = colors[i].Value
	}

	pattern := make([][]color.RGBA, h)
	for i := range pattern {
		pattern[i] = make([]color.RGBA, w)
	}

	var wg sync.WaitGroup
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		wg.Add(1)
		go func(y int) {
			defer wg.Done()
			for x := bounds.Min.X; x < bounds.Max.X; x++ {
				r, g, b, _ := img.At(x, y).RGBA()
				c := color.RGBA{uint8(r >> 8), uint8(g >> 8), uint8(b >> 8), 255}
				patternY := int(float64(y-bounds.Min.Y) * float64(h) / float64(bounds.Dy()))
				patternX := int(float64(x-bounds.Min.X) * float64(w) / float64(bounds.Dx()))
				pattern[patternY][patternX] = findClosestColor(c, pallete)
			}
		}(y)
	}
	wg.Wait()

	return pattern
}

func main() {
	file, err := os.Open(os.Args[1:][0])
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	defer file.Close()

	img, err := jpeg.Decode(file)
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}

	createPattern(img, 100, 20)
}
