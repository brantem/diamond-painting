package main

import (
	"fmt"
	"image"
	_ "image/jpeg"
	"image/png"
	"os"
	"strconv"
	"strings"
	"time"

	"diamond.brantem.com/pattern-generator/pixelator"
	"diamond.brantem.com/pattern-generator/reducer"
)

func main() {
	file, err := os.Open(os.Args[1:][0])
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	defer file.Close()

	s := strings.Split(file.Name(), "/")
	s2 := strings.Split(s[len(s)-1], ".")
	name := strings.Join(s2[:1], ".")

	img, format, err := image.Decode(file)
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	fmt.Printf("format: %s\n", format)

	maxTotalPixels, err := strconv.Atoi(os.Args[1:][1])
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	fmt.Println("maxTotalPixels: ", maxTotalPixels)

	maxColors, err := strconv.Atoi(os.Args[1:][2])
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	fmt.Println("maxColors: ", maxColors)

	p := pixelator.New(maxTotalPixels, 0.10, 96)
	pixelated := p.Do(img)
	if f, err := os.Create(fmt.Sprintf("%s_pixelated_%d.png", name, time.Now().Unix())); err != nil {
		fmt.Println("Error: ", err)
		return
	} else {
		defer f.Close()
		png.Encode(f, pixelated)
	}

	r := reducer.New(20)
	reduced := r.Do(pixelated)
	if f, err := os.Create(fmt.Sprintf("%s_reduced_%d.png", name, time.Now().Unix())); err != nil {
		fmt.Println("Error: ", err)
		return
	} else {
		defer f.Close()
		png.Encode(f, reduced)
	}
}
