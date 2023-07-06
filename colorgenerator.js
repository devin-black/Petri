class ColorGenerator {
    constructor() {
        this.colors = new Array(255).fill(0).map(() => this.getRandomColor());
    }

    getRandomColor() {
        // Generate a random red value under N
        let red = Math.floor(Math.random() * 5);

        // Generate random green and blue values (128 - 255) for brighter colors
        let green = Math.floor(Math.random() * (256 - 128) + 128);
        let blue = Math.floor(Math.random() * (256 - 128) + 128);

        // Convert values to hexadecimal and add leading zeros if necessary
        red = ("0" + red.toString(16)).slice(-2);
        green = ("0" + green.toString(16)).slice(-2);
        blue = ("0" + blue.toString(16)).slice(-2);

        // Concatenate the red, green, and blue hexadecimal values with '#' prefix
        let randomColor = '#' + red + green + blue;

        return randomColor;
    }

    getOneColor() {
        // Choose a random color from the array
        let randomIndex = Math.floor(Math.random() * this.colors.length);
        return this.colors[randomIndex];
    }
}