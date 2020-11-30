module.exports = {  
    verbose: true,
    rootDir: './tests/api',
    reporters: [
        "default",
        [ "jest-junit",
            { 
              suiteName: "jest api tests",
              outputDirectory: "results/json",
              outputName: "api-tests.xml"
            }
        ]
    ],
    testResultsProcessor: "jest-junit",
    colors: true
};