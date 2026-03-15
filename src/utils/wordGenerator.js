import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ImageRun, Header, HorizontalPositionRelativeFrom, HorizontalPositionAlign, VerticalPositionRelativeFrom, VerticalPositionAlign, TextWrappingType, TextWrappingSide } from 'docx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import { handleGoogleDriveUrl } from './imageHandler';

const sanitizeText = (text) => {
    if (!text) return "";
    return text
        .replace(/∑|Σ/g, "Sigma")
        .replace(/∈/g, "in")
        .replace(/≥/g, ">=")
        .replace(/≤/g, "<=")
        .replace(/≠/g, "!=")
        .replace(/∉/g, "not in")
        .replace(/⊆/g, "subset of")
        .replace(/∀/g, "for all")
        .replace(/∃/g, "exists")
        .replace(/→/g, "->")
        .replace(/α/g, "alpha")
        .replace(/β/g, "beta")
        .replace(/γ/g, "gamma")
        .replace(/δ/g, "delta")
        .replace(/θ/g, "theta")
        .replace(/λ/g, "lambda")
        .replace(/μ/g, "mu")
        .replace(/π/g, "pi")
        .replace(/ρ/g, "rho")
        .replace(/σ/g, "sigma")
        .replace(/τ/g, "tau")
        .replace(/ω/g, "omega")
        .replace(/Δ/g, "Delta")
        .replace(/Φ/g, "Phi")
        .replace(/Ω/g, "Omega")
        .replace(/≈/g, "~")
        .replace(/±/g, "+/-")
        .replace(/°/g, " degrees")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3");
};


export const downloadPaperAsWord = async (paper) => {
    if (!paper) {
        toast.error("Paper data is missing");
        return;
    }

    const loadImageAsBase64 = async (url) => {
        try {
            if (!url) return null;

            // Handle local logo import
            if (typeof url === 'object' && url.default) {
                url = url.default;
            }
            if (url.includes('(') && url.includes(')')) {
                url = url.split(' ')[0];
            }

            url = handleGoogleDriveUrl(url);

            // Prepend base URL if it's just a filename
            if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('/')) {
                url = `https://datapro.in/uploads/${url}`;
            }

            const response = await fetch(url, {
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                console.error(`Failed to load image: ${response.status} ${response.statusText}`);
                return null;
            }

            const blob = await response.blob();
            return await blob.arrayBuffer();
        } catch (error) {
            console.error("Error loading image:", error);
            return null;
        }
    };

    const processWatermarkImage = async (buffer) => {
        if (!buffer) return null;
        return new Promise((resolve) => {
            const blob = new Blob([buffer]);
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.globalAlpha = 0.06; // Match PDF opacity
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((processedBlob) => {
                    processedBlob.arrayBuffer().then(buf => resolve({
                        data: buf,
                        width: img.width,
                        height: img.height
                    }));
                    URL.revokeObjectURL(url);
                }, 'image/png');
            };
            img.src = url;
        });
    };

    try {
        // Load logo with error handling
        let logoData = null;
        try {
            const rawLogo = await loadImageAsBase64(logo);
            logoData = await processWatermarkImage(rawLogo);
        } catch (logoError) {
            console.warn("Logo could not be loaded, continuing without logo:", logoError);
        }

        const sortedQuestions = [...paper.questions].sort((a, b) => a.marks - b.marks);
        const docChildren = [];

        docChildren.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Uttaranchal University", bold: true, size: 32 })],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Uttaranchal Institute of Technology", size: 24 })],
                spacing: { after: 100 },
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                    text: (paper.title || "Examination Paper").replace(/ - Set [A-Z]/gi, "") || (paper.semester || "Semester"),
                    bold: true,
                    size: 26
                })],
                spacing: { after: 100 },
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: (paper.department || "").toUpperCase(), bold: true, size: 24 })],
                spacing: { after: 400 },
            })
        );

        // 2. Meta Data Table
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Programme: ", bold: true, italics: true }), new TextRun({ text: paper.program || "B.Tech" })] })],
                            width: { size: 50, type: WidthType.PERCENTAGE },
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Course Code: ", bold: true, italics: true }), new TextRun({ text: (paper.subjectCode || "").toUpperCase() })] })],
                            width: { size: 50, type: WidthType.PERCENTAGE },
                        }),
                    ],
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Course: ", bold: true, italics: true }), new TextRun({ text: (paper.subjectName || "").toUpperCase() })] })],
                        }),
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Section: ", bold: true, italics: true }), new TextRun({ text: (paper.section || "A/B/C").toUpperCase() })] })],
                        }),
                    ],
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: "Roll No: ", bold: true, italics: true }), new TextRun({ text: "........................................................................" })] })],
                            columnSpan: 2
                        }),
                    ],
                }),
            ],
        });
        docChildren.push(headerTable);

        // 3. Exam Details
        const formatDuration = (d) => {
            const val = parseFloat(d) || 3;
            return (val * 60).toString();
        };

        const uniqueMarks = new Set(paper.questions.map(q => q.marks)).size;
        docChildren.push(
            new Paragraph({
                children: [new TextRun({ text: `Note: Question Paper has ${uniqueMarks} sections. Read carefully before answering.`, bold: true, size: 20 })],
                spacing: { before: 400, after: 200 },
            }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: `Time: ${formatDuration(paper.duration)} Minutes`, bold: true, size: 20 })] })],
                            }),
                            new TableCell({
                                children: [new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    children: [new TextRun({ text: `Max Marks: ${paper.totalMarks || 30}`, bold: true, size: 20 })]
                                })],
                            }),
                        ],
                    }),
                ],
            })
        );

        // 4. Questions Loop
        let currentMark = null;
        let groupIndex = 0;
        let questionCounter = 0;

        for (let i = 0; i < sortedQuestions.length; i++) {
            const q = sortedQuestions[i];

            if (q.marks !== currentMark) {
                currentMark = q.marks;
                const sectionChar = String.fromCharCode(65 + groupIndex);
                const sectionType = q.marks <= 2 ? "Very Short Answer" : (q.marks <= 4 ? "Short Answer" : "Long Answer");

                docChildren.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `SECTION - ${sectionChar} (${sectionType} Questions)`, bold: true, size: 26, underline: {} })],
                        spacing: { before: 400, after: 200 },
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `Q. ${groupIndex + 1}: Attempt all questions. Each question carries ${q.marks} marks.`, bold: true, size: 20 })],
                        spacing: { after: 200 },
                    })
                );
                groupIndex++;
                questionCounter = 0;
            }

            docChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `${String.fromCharCode(97 + questionCounter)}. `, bold: true, size: 20 }),
                        new TextRun({ text: sanitizeText(q.question || ""), size: 20 }),
                    ],
                    spacing: { before: 100 },
                }),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            text: `[${q.co || ''}, ${q.bloomLevel || 'RE'}]`,
                            bold: true,
                            italics: true,
                            size: 16,
                            color: q.imageURL ? "3B82F6" : "555555"
                        }),
                    ],
                    spacing: { after: 100 },
                })
            );
            questionCounter++;

            if (q.orQuestion?.question) {
                docChildren.push(
                    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "OR", bold: true, size: 24 })], spacing: { before: 200, after: 200 } }),
                    new Paragraph({ children: [new TextRun({ text: sanitizeText(q.orQuestion.question), size: 20 })] }),
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                            new TextRun({
                                text: `[${q.orQuestion.co || ''}, ${q.orQuestion.bloomLevel || 'RE'}]`,
                                bold: true,
                                italics: true,
                                size: 16,
                                color: q.orQuestion.imageURL ? "3B82F6" : "555555"
                            }),
                        ],
                        spacing: { after: 100 },
                    })
                );

                if (q.orQuestion.imageURL) {
                    try {
                        const orImgBuffer = await loadImageAsBase64(q.orQuestion.imageURL);
                        if (orImgBuffer) {
                            docChildren.push(
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new ImageRun({
                                            data: orImgBuffer,
                                            transformation: { width: 300, height: 200 },
                                            type: 'png',
                                        })
                                    ],
                                    spacing: { before: 200, after: 200 }
                                })
                            );
                        }
                    } catch (err) {
                        console.warn("Could not load OR image:", err);
                    }
                }
            }

            if (q.options?.length > 0) {
                q.options.forEach((opt, idx) => {
                    docChildren.push(new Paragraph({ children: [new TextRun({ text: `    ${String.fromCharCode(65 + idx)}) ${opt}`, size: 18 })] }));
                });
            }

            // Load and add question image if exists
            if (q.imageURL) {
                try {
                    const imgBuffer = await loadImageAsBase64(q.imageURL);
                    if (imgBuffer) {
                        docChildren.push(
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new ImageRun({
                                        data: imgBuffer,
                                        transformation: { width: 300, height: 200 },
                                        type: 'png',
                                    })
                                ],
                                spacing: { before: 200, after: 200 }
                            })
                        );
                    }
                } catch (imgError) {
                    console.warn(`Could not load image for question ${i}:`, imgError);
                }
            }
        }

        docChildren.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "\n*** END OF QUESTION PAPER ***", bold: true, size: 22 })],
                spacing: { before: 800 },
            })
        );

        const docObj = new Document({
            sections: [{
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                children: [
                                    logoData ? new ImageRun({
                                        data: logoData.data,
                                        transformation: { 
                                            width: 380, 
                                            height: (logoData.height * 380) / logoData.width 
                                        },
                                        type: 'png',
                                        floating: {
                                            horizontalPosition: {
                                                relative: HorizontalPositionRelativeFrom.PAGE,
                                                align: HorizontalPositionAlign.CENTER,
                                            },
                                            verticalPosition: {
                                                relative: VerticalPositionRelativeFrom.PAGE,
                                                align: VerticalPositionAlign.CENTER,
                                            },
                                            wrap: {
                                                type: TextWrappingType.NONE,
                                            },
                                            behindText: true,
                                        },
                                    }) : new TextRun(""),
                                ],
                            }),
                        ],
                    }),
                },
                children: docChildren,
            }],
        });

        const blob = await Packer.toBlob(docObj);
        saveAs(blob, `${(paper.title || "Examination_Paper").replace(/\s+/g, '_')}.docx`);
        toast.success("Word Document Saved!");

    } catch (err) {
        console.error("Generator Error:", err);
        toast.error("Format error - try again");
    }
};