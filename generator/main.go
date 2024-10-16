//go:build js && wasm
// +build js,wasm

package main

import (
	"bytes"
	"fmt"
	"image"
	_ "image/jpeg"
	"syscall/js"

	"diamond.brantem.com/generator/pixelator"
	"diamond.brantem.com/generator/reducer"
)

func main() {
	c := make(chan struct{}, 0)
	js.Global().Set("generate", js.FuncOf(generate))
	<-c
}

func generate(this js.Value, args []js.Value) interface{} {
	img := getImage(args[0])

	options := args[1]

	p := pixelator.New(options.Get("size").Int())
	pixelated := p.Do(img)

	result := js.Global().Get("Object").New()

	metadataObj := js.Global().Get("Object").New()
	metadataObj.Set("width", pixelated.Rect.Dx())
	metadataObj.Set("height", pixelated.Rect.Dy())
	result.Set("metadata", metadataObj)

	r := reducer.New(options.Get("colors").Int())
	reduced, colors := r.Do(pixelated)

	pixels := getPixels(reduced)
	data := js.Global().Get("Uint8ClampedArray").New(len(pixels))
	js.CopyBytesToJS(data, pixels)
	result.Set("data", data)

	colorsObj := js.Global().Get("Object").New()
	for color, usage := range colors {
		r, g, b, _ := color.RGBA()
		colorsObj.Set(fmt.Sprintf("#%02X%02X%02X", uint8(r>>8), uint8(g>>8), uint8(b>>8)), usage)
	}
	metadataObj.Set("colors", colorsObj)

	return result
}

func getImage(buf js.Value) image.Image {
	arr := js.Global().Get("Uint8ClampedArray").New(buf)
	data := make([]byte, arr.Length())
	js.CopyBytesToGo(data, arr)

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		fmt.Println("Error: ", err)
		return nil
	}
	return img
}

func getPixels(img *image.Paletted) []uint8 {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	data := make([]uint8, width*height*4)

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, a := img.At(x, y).RGBA()
			i := (y*width + x) * 4
			data[i] = uint8(r >> 8)
			data[i+1] = uint8(g >> 8)
			data[i+2] = uint8(b >> 8)
			data[i+3] = uint8(a >> 8)
		}
	}
	return data
}
