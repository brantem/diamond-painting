package pixelator

import (
	"image"
	"image/color"
	"math"
	"runtime"
	"sync"
)

type Pixelator struct {
	max  int
	size int

	input  image.Image
	output *image.RGBA
}

func New(max int, pixelSizeInches, dpi float64) *Pixelator {
	return &Pixelator{
		max:  max,
		size: int(math.Round(pixelSizeInches * dpi)),
	}
}

func (p *Pixelator) Do(img image.Image) image.Image {
	p.input = img

	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	aspectRatio := float64(w) / float64(h)

	px := w / p.size
	py := h / p.size

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

	w2 := px * p.size
	h2 := py * p.size
	p.output = image.NewRGBA(image.Rect(0, 0, w2, h2))

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
			p.processRows(start, end, px, w, h, w2, h2)
		}(start, end)
	}

	wg.Wait()
	return p.output
}

func (p *Pixelator) processRows(start, end, px, w, h, w2, h2 int) {
	scaleX := float64(w) / float64(w2)
	scaleY := float64(h) / float64(h2)

	for y := start; y < end; y++ {
		for x := 0; x < px; x++ {
			origMinX := int(float64(x*p.size) * scaleX)
			origMinY := int(float64(y*p.size) * scaleY)
			origMaxX := min(int(float64((x+1)*p.size)*scaleX), w)
			origMaxY := min(int(float64((y+1)*p.size)*scaleY), h)

			r, g, b, a := p.averageColor(origMinX, origMinY, origMaxX, origMaxY)
			color := color.RGBA{r, g, b, a}
			p.drawBlock(x, y, color)
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

func (p *Pixelator) drawBlock(x, y int, color color.RGBA) {
	for py := y * p.size; py < (y+1)*p.size; py++ {
		for px := x * p.size; px < (x+1)*p.size; px++ {
			p.output.Set(px, py, color)
		}
	}
}
