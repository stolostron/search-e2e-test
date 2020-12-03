module.exports = {  
    verbose: true,
    rootDir: './tests/api',
    reporters: [
        "default",
        [ "jest-junit",
            { 
              suiteName: "Search API tests",
              outputDirectory: "results",
              outputName: "api-tests.xml"
            }
        ]
    ],
    testResultsProcessor: "jest-junit"
};