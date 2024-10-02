package reducer

import (
	"image"
	"image/color"
	"sort"
)

type Reducer struct {
	max int
}

func New(max int) *Reducer {
	return &Reducer{max: max}
}

type ColorBox struct {
	Colors [][3]uint8
	Min    [3]uint8
	Max    [3]uint8
}

func (r *Reducer) Do(img image.Image) *image.Paletted {
	bounds := img.Bounds()

	colors := make([][3]uint8, 0, bounds.Dx()*bounds.Dy())
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			colors = append(colors, [3]uint8{uint8(r >> 8), uint8(g >> 8), uint8(b >> 8)})
		}
	}

	uniqueColors := make(map[[3]uint8]struct{})
	for _, c := range colors {
		uniqueColors[c] = struct{}{}
	}
	if len(uniqueColors) <= r.max {
		palette := make(color.Palette, len(uniqueColors))
		i := 0
		for c := range uniqueColors {
			palette[i] = color.RGBA{c[0], c[1], c[2], 255}
			i++
		}
		return r.createPalettedImage(img, palette)
	}

	boxes := r.medianCut(colors, r.max)

	palette := make(color.Palette, len(boxes))
	for i, box := range boxes {
		palette[i] = averageColor(box.Colors)
	}

	return r.createPalettedImage(img, palette)
}

func (r *Reducer) medianCut(colors [][3]uint8, maxColors int) []ColorBox {
	boxes := []ColorBox{createColorBox(colors)}
	for len(boxes) < maxColors {
		i := findBoxWithLargestRange(boxes)
		if i == -1 {
			break
		}
		box1, box2 := splitBox(boxes[i])
		boxes[i] = box1
		boxes = append(boxes, box2)
	}
	return boxes
}

func createColorBox(colors [][3]uint8) ColorBox {
	box := ColorBox{
		Colors: colors,
		Min:    [3]uint8{255, 255, 255},
		Max:    [3]uint8{0, 0, 0},
	}

	for _, c := range colors {
		for i := 0; i < 3; i++ {
			box.Min[i] = min(box.Min[i], c[i])
			box.Max[i] = max(box.Max[i], c[i])
		}
	}

	return box
}

func findBoxWithLargestRange(boxes []ColorBox) int {
	maxRange, index := uint8(0), -1
	for i, box := range boxes {
		for j := 0; j < 3; j++ {
			r := box.Max[j] - box.Min[j]
			if r > maxRange {
				maxRange, index = r, i
			}
		}
	}
	return index
}

func splitBox(box ColorBox) (ColorBox, ColorBox) {
	axis := 0
	for i := 1; i < 3; i++ {
		if box.Max[i]-box.Min[i] > box.Max[axis]-box.Min[axis] {
			axis = i
		}
	}
	sort.Slice(box.Colors, func(i, j int) bool {
		return box.Colors[i][axis] < box.Colors[j][axis]
	})
	median := len(box.Colors) / 2
	return createColorBox(box.Colors[:median]), createColorBox(box.Colors[median:])
}

func averageColor(colors [][3]uint8) color.Color {
	var r, g, b uint32
	for _, c := range colors {
		r += uint32(c[0])
		g += uint32(c[1])
		b += uint32(c[2])
	}
	n := uint32(len(colors))
	return color.RGBA{uint8(r / n), uint8(g / n), uint8(b / n), 255}
}

func (r *Reducer) createPalettedImage(img image.Image, palette color.Palette) *image.Paletted {
	bounds := img.Bounds()
	output := image.NewPaletted(bounds, palette)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			output.Set(x, y, img.At(x, y))
		}
	}
	return output
}
