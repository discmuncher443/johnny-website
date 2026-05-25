// The Java code block that will be typed out
const codeSnippet = `class SoftwareEngineer {
    String name = "Johnathan Sayle";
    String location = "Columbus, OH";
    String role = "Fullstack Developer";

    void executeDailyRoutine() {
        writeCode("Java", "Spring Boot", "Vue");
        crushLongRun(10, "miles");
        haveFun();
    }
}`;

const typedTextElement = document.getElementById('typed-code');
let index = 0;

function typeCode() {
    if (index < codeSnippet.length) {
        // Add the next character
        typedTextElement.textContent += codeSnippet.charAt(index);
        index++;

        // Add a slightly randomized delay to make it look like human typing
        var randomDelay = Math.random() * 50 + 20; // Between 20ms and 70ms per keystroke
        const longerRandomDelay = Math.random() * 20;
        if (Math.floor(longerRandomDelay) == 13) {
            randomDelay *= (Math.random() * 5 + 1);
        }
        setTimeout(typeCode, randomDelay);
    }
}

// Start typing after a short 1-second delay so the user has time to notice it
setTimeout(typeCode, 1000);