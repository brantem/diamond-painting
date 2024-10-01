package reducer

import (
	"image"
	"image/color"
	"sort"
)

type Reducer struct {
	max int

	input image.Image
}

func New(max int) *Reducer {
	return &Reducer{
		max: max,
	}
}

type ColorBox struct {
	Colors [][3]uint8
	Min    [3]uint8
	Max    [3]uint8
}

func (r *Reducer) Do(img image.Image) image.Image {
	r.input = img

	bounds := r.input.Bounds()

	colors := make([][3]uint8, 0, bounds.Dx()*bounds.Dy())
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, _ := r.input.At(x, y).RGBA()
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
		return r.createPalettedImage(palette)
	}

	boxes := r.medianCut(colors, r.max)

	palette := make(color.Palette, len(boxes))
	for i, box := range boxes {
		palette[i] = r.averageColor(box.Colors)
	}

	return r.createPalettedImage(palette)
}

func (r *Reducer) medianCut(colors [][3]uint8, maxColors int) []ColorBox {
	initialBox := r.createColorBox(colors)
	boxes := []ColorBox{initialBox}

	for len(boxes) < maxColors {
		boxToSplit := r.findBoxWithLargestRange(boxes)
		if boxToSplit == -1 {
			break
		}
		box1, box2 := r.splitBox(boxes[boxToSplit])
		boxes[boxToSplit] = box1
		boxes = append(boxes, box2)
	}

	return boxes
}

func (r *Reducer) createColorBox(colors [][3]uint8) ColorBox {
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

func (r *Reducer) findBoxWithLargestRange(boxes []ColorBox) int {
	maxRange := uint8(0)
	boxIndex := -1

	for i, box := range boxes {
		for j := 0; j < 3; j++ {
			r := box.Max[j] - box.Min[j]
			if r > maxRange {
				maxRange = r
				boxIndex = i
			}
		}
	}

	return boxIndex
}

func (r *Reducer) splitBox(box ColorBox) (ColorBox, ColorBox) {
	longestAxis := 0
	axisLength := uint8(0)

	for i := 0; i < 3; i++ {
		length := box.Max[i] - box.Min[i]
		if length > axisLength {
			axisLength = length
			longestAxis = i
		}
	}

	sort.Slice(box.Colors, func(i, j int) bool {
		return box.Colors[i][longestAxis] < box.Colors[j][longestAxis]
	})

	median := len(box.Colors) / 2
	box1 := ColorBox{Colors: box.Colors[:median]}
	box2 := ColorBox{Colors: box.Colors[median:]}

	return r.createColorBox(box1.Colors), r.createColorBox(box2.Colors)
}

func (*Reducer) averageColor(colors [][3]uint8) color.Color {
	var r, g, b uint32
	for _, c := range colors {
		r += uint32(c[0])
		g += uint32(c[1])
		b += uint32(c[2])
	}
	count := uint32(len(colors))
	return color.RGBA{
		R: uint8(r / count),
		G: uint8(g / count),
		B: uint8(b / count),
		A: 255,
	}
}

func (r *Reducer) createPalettedImage(palette color.Palette) *image.Paletted {
	bounds := r.input.Bounds()
	output := image.NewPaletted(bounds, palette)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			output.Set(x, y, r.input.At(x, y))
		}
	}
	return output
}
