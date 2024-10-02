//go:build js && wasm
// +build js,wasm

package main

import (
	"bytes"
	"fmt"
	"image"
	_ "image/jpeg"
	"image/png"
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

	metadataObj := js.Global().Get("Object").New(2)
	metadataObj.Set("width", pixelated.Rect.Dx())
	metadataObj.Set("height", pixelated.Rect.Dy())
	result.Set("metadata", metadataObj)

	r := reducer.New(options.Get("colors").Int())
	reduced, colors := r.Do(pixelated)

	var buf bytes.Buffer
	png.Encode(&buf, reduced)

	b := buf.Bytes()
	data := js.Global().Get("Uint8Array").New(len(b))
	js.CopyBytesToJS(data, b)
	result.Set("data", data)

	colorsObj := js.Global().Get("Object").New(len(colors))
	for color, usage := range colors {
		r, g, b, _ := color.RGBA()
		colorsObj.Set(fmt.Sprintf("#%02X%02X%02X", uint8(r>>8), uint8(g>>8), uint8(b>>8)), usage)
	}
	metadataObj.Set("colors", colorsObj)

	return result
}

func getImage(buf js.Value) image.Image {
	arr := js.Global().Get("Uint8Array").New(buf)
	data := make([]byte, arr.Length())
	js.CopyBytesToGo(data, arr)

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		fmt.Println("Error: ", err)
		return nil
	}
	return img
}
