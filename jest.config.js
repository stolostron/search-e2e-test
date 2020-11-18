module.exports = {  
    verbose: true,
    rootDir: './tests/api',
    reporters: [
        "default",
        [ "jest-junit",
            { 
              suiteName: "jest api tests",
              outputDirectory: "results/json",
              outputName: "junit.xml"
            }
        ]
    ]
};