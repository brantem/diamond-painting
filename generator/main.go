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
	arrayBuffer := args[0]

	arr := js.Global().Get("Uint8Array").New(arrayBuffer)
	data := make([]byte, arr.Length())
	js.CopyBytesToGo(data, arr)

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		fmt.Println("Error: ", err)
		return nil
	}

	p := pixelator.New(150)
	pixelated := p.Do(img)

	result := js.Global().Get("Object").New()
	result.Set("width", pixelated.Rect.Dx())
	result.Set("height", pixelated.Rect.Dy())

	r := reducer.New(20)
	reduced := r.Do(pixelated)

	pixelArr := js.Global().Get("Uint8Array").New(len(reduced.Pix))
	js.CopyBytesToJS(pixelArr, reduced.Pix)
	result.Set("pixels", pixelArr)

	colors := js.Global().Get("Array").New(len(reduced.Palette))
	for i, c := range reduced.Palette {
		r, g, b, _ := c.RGBA()
		hexColor := fmt.Sprintf("#%02X%02X%02X", uint8(r>>8), uint8(g>>8), uint8(b>>8))
		colors.SetIndex(i, hexColor)
	}
	result.Set("colors", colors)

	return result

}
