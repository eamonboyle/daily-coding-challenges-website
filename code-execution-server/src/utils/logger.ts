// import winston from "winston"

// // Create a logger instance
// const logger = winston.createLogger({
//     level: "info", // Set the default log level
//     format: winston.format.combine(
//         winston.format.timestamp(), // Add timestamp to logs
//         winston.format.json() // Log in JSON format
//     ),
//     transports: [
//         new winston.transports.Console(), // Log to console
//         new winston.transports.File({ filename: "error.log", level: "error" }), // Log errors to a file
//         new winston.transports.File({ filename: "combined.log" }) // Log all messages to a file
//     ]
// })

// // Export the logger
// export default logger

import { createLogger, format, transports } from "winston"

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(
            ({ timestamp, level, message }) =>
                `${timestamp} [${level.toUpperCase()}]: ${message}`
        )
    ),
    transports: [new transports.Console()]
})

export default logger
