const codeSnippet = `class SoftwareEngineer {
    String name = "Johnathan Sayle";
    String location = "Columbus, OH";
    String role = "Fullstack Developer";

    void executeDailyRoutine() {
        writeCode("Java", "Spring Boot", "Vue");
        crushLongRun(10, "miles");
        print("Checkout my Interactive Resume");
    }
}`;

const typedTextElement = document.getElementById('typed-code');
let index = 0;

function typeCode() {
    if (index < codeSnippet.length) {
        // Type the next character
        typedTextElement.textContent += codeSnippet.charAt(index);
        index++;
        
        // Random delay for human-like typing
        const randomDelay = Math.random() * 50 + 20;
        setTimeout(typeCode, randomDelay);
    } else {
        // 🎯 TYPING FINISHED: Swap the plain text for a clickable HTML link!
        typedTextElement.innerHTML = typedTextElement.innerHTML.replace(
            'Checkout my Interactive Resume',
            '<a href="pages/resume.html" class="code-link">Checkout my Interactive Resume</a>'
        );
    }
}

// Start typing after a 1-second delay
setTimeout(typeCode, 1000);