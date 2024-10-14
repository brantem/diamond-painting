package pixelator

import (
	"image"
	"image/color"
	"runtime"
	"sync"
)

type Pixelator struct {
	max int
}

func New(max int) *Pixelator {
	return &Pixelator{max: max}
}

// Do pixelates the image by resizing and averaging pixel blocks
func (p *Pixelator) Do(img image.Image) *image.RGBA {
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	aspectRatio := float64(w) / float64(h)

	px := w
	py := h

	// maintain aspect ratio
	if px > p.max {
		px = p.max
		py = int(float64(px) / aspectRatio)
	}

	if py > p.max {
		py = p.max
		px = int(float64(py) * aspectRatio)
	}

	// ensure minimum size of 1x1
	px = max(1, px)
	py = max(1, py)

	pixelated := image.NewRGBA(image.Rect(0, 0, px, py))

	numRoutines := runtime.NumCPU()
	rowsPerRoutine := py / numRoutines

	var wg sync.WaitGroup
	for i := 0; i < numRoutines; i++ {
		wg.Add(1)
		start := i * rowsPerRoutine
		end := (i + 1) * rowsPerRoutine
		if i == numRoutines-1 {
			end = py // last goroutine handles remaining rows
		}

		go func(start, end int) {
			defer wg.Done()
			processRows(img, pixelated, start, end, w, h, px, py)
		}(start, end)
	}
	wg.Wait()

	return pixelated
}

func processRows(img image.Image, pixelated *image.RGBA, start, end, w, h, px, py int) {
	scaleX := float64(w) / float64(px)
	scaleY := float64(h) / float64(py)

	for y := start; y < end; y++ {
		for x := 0; x < px; x++ {
			// determine the region in the original image
			minX := int(float64(x) * scaleX)
			minY := int(float64(y) * scaleY)
			maxX := min(int(float64((x+1))*scaleX), w)
			maxY := min(int(float64((y+1))*scaleY), h)

			r, g, b := averageColor(img, minX, minY, maxX, maxY)
			color := color.RGBA{r, g, b, 255}
			pixelated.Set(x, y, color)
		}
	}
}

// average the color values within a block of pixels
func averageColor(img image.Image, minX, minY, maxX, maxY int) (uint8, uint8, uint8) {
	var r, g, b uint64
	count := uint64((maxX - minX) * (maxY - minY))

	// sum the colors in the block
	for py := minY; py < maxY; py++ {
		for px := minX; px < maxX; px++ {
			pr, pg, pb, _ := img.At(px, py).RGBA()
			r += uint64(pr)
			g += uint64(pg)
			b += uint64(pb)
		}
	}

	// calculate average color
	if count > 0 {
		r = (r / count) >> 8
		g = (g / count) >> 8
		b = (b / count) >> 8
	}

	return uint8(r), uint8(g), uint8(b)
}
