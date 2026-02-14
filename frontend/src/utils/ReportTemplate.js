export const reportTemplate = {
    // CONTENT ABOVE THE TABLE
    reportHeader: {
        title: "OFFICIAL REVIEW REPORT",
        subTitle: "Generated Performance Summary",
        description: [
            "This report aggregates user feedback metrics across various process indicators.",
            "Please analyze the 'Process' column for specific question details and corresponding ratings."
        ],
        // You can add more lines here, they will appear as separate paragraphs
        extraInfo: "Confidential - Internal Use Only"
    },

    // TABLE COLUMN HEADERS
    tableColumns: {
        srNo: "अ. क्र.",
        subject: "विषय व सादरकर्ते",
        process: "प्रतवारी व पध्दत",
        ratings: {
            veryGood: "अतिउत्तम",
            good: "उच्च",
            medium: "मध्यम",
            normal: "साधारण",
        },
        total: "एकुण"
    },

    // STYLING CONFIG (Optional - for simple tweaks)
    styles: {
        headerColor: "bg-gray-100", // Tailwind class for header background
        textColor: "text-gray-800"
    }
};

export const getRatingLabel = (score) => {
    switch (score) {
        case 5: return reportTemplate.tableColumns.ratings.veryGood;
        case 4: return reportTemplate.tableColumns.ratings.good;
        case 3: return reportTemplate.tableColumns.ratings.medium;
        case 2: return reportTemplate.tableColumns.ratings.normal;
        default: return "Poor";
    }
};
