package pixelator

import (
	"image"
	"image/color"
	"runtime"
	"sync"
)

type Pixelator struct {
	max int

	input  image.Image
	output *image.RGBA
}

func New(max int) *Pixelator {
	return &Pixelator{max: max}
}

func (p *Pixelator) Do(img image.Image) *image.RGBA {
	p.input = img

	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	aspectRatio := float64(w) / float64(h)

	px := w
	py := h

	if px > p.max {
		px = p.max
		py = int(float64(px) / aspectRatio)
	}

	if py > p.max {
		py = p.max
		px = int(float64(py) * aspectRatio)
	}

	px = max(1, px)
	py = max(1, py)

	p.output = image.NewRGBA(image.Rect(0, 0, px, py))

	var wg sync.WaitGroup
	numRoutines := runtime.NumCPU()
	rowsPerRoutine := py / numRoutines

	for i := 0; i < numRoutines; i++ {
		wg.Add(1)
		start := i * rowsPerRoutine
		end := (i + 1) * rowsPerRoutine
		if i == numRoutines-1 {
			end = py
		}

		go func(start, end int) {
			defer wg.Done()
			p.processRows(start, end, w, h, px, py)
		}(start, end)
	}

	wg.Wait()
	return p.output
}

func (p *Pixelator) processRows(start, end, w, h, px, py int) {
	scaleX := float64(w) / float64(px)
	scaleY := float64(h) / float64(py)

	for y := start; y < end; y++ {
		for x := 0; x < px; x++ {
			minX := int(float64(x) * scaleX)
			minY := int(float64(y) * scaleY)
			maxX := min(int(float64((x+1))*scaleX), w)
			maxY := min(int(float64((y+1))*scaleY), h)

			r, g, b, a := p.averageColor(minX, minY, maxX, maxY)
			color := color.RGBA{r, g, b, a}
			p.output.Set(x, y, color)
		}
	}
}

func (p *Pixelator) averageColor(minX, minY, maxX, maxY int) (uint8, uint8, uint8, uint8) {
	var r, g, b, a uint64
	count := uint64((maxX - minX) * (maxY - minY))

	for py := minY; py < maxY; py++ {
		for px := minX; px < maxX; px++ {
			pr, pg, pb, pa := p.input.At(px, py).RGBA()
			r += uint64(pr)
			g += uint64(pg)
			b += uint64(pb)
			a += uint64(pa)
		}
	}

	if count > 0 {
		r = (r / count) >> 8
		g = (g / count) >> 8
		b = (b / count) >> 8
		a = (a / count) >> 8
	}

	return uint8(r), uint8(g), uint8(b), uint8(a)
}
