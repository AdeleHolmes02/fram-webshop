# FRAM – Webshop with AI Chatbot

FRAM is a prototype webshop developed as part of the *Frontend Essentials* course.  
The purpose of this project was to apply what I have learned about frontend development in a realistic context, and to explore how AI functionality can be integrated into a web solution.

The project combines a static frontend with a small backend service and an AI-powered chatbot that answers questions based on a predefined knowledge base.



## About the Project

The frontend is built using HTML, CSS, and JavaScript.  
My main focus was to keep the structure clean and easy to understand, with a clear separation between content, styling, and logic.

The interface represents a simple webshop where users can browse content and interact with a chatbot. JavaScript is used to handle user input, send requests to the backend, and update the interface dynamically based on responses.



## Frontend Development

On the frontend, I used JavaScript to handle typical user interactions such as form input and button clicks.  
Communication with the backend is done using asynchronous fetch requests, which allowed me to better understand how client-side JavaScript works together with server-side logic.

CSS is used to create a consistent layout and visual style, while HTML follows a semantic structure to support readability and accessibility.



## Backend and API Integration

The backend is built with Node.js and Express and serves as a bridge between the frontend and external services.

It is responsible for:
- receiving requests from the frontend
- processing chatbot messages
- loading a local knowledge file
- sending requests to the OpenAI API when needed

This part of the project helped me understand the difference between client-side and server-side JavaScript, and how they work together in a complete web application.



## Use of AI

The chatbot uses the OpenAI API to generate responses, but it is intentionally limited to only use information from a local `knowledge.txt` file.

If a question cannot be answered based on this knowledge, the chatbot responds with uncertainty instead of guessing.  
This approach reflects a controlled and responsible use of AI, where the goal is to support the user without providing misleading information.



## Version Control and Workflow

Git has been used throughout the project to manage changes and track progress.  
Using version control made it easier to experiment, fix mistakes, and document development steps in a structured way.

The repository is organised so that the frontend and backend are clearly separated, making the project easier to understand for others who review the code.



## Ethical and Professional Considerations

While developing this project, I have been mindful of ethical aspects of web development.  
This includes protecting sensitive information such as API keys, being transparent about AI-generated content, and considering accessibility and inclusivity in the structure of the application.

The project reflects how developers create value by making thoughtful technical decisions that benefit both users and stakeholders.



## How to Run the Project

### Frontend

The frontend is fully static and can be viewed by opening `index.html` directly in a web browser.

```bash
npx serve .
