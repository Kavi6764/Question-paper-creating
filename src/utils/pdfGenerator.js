import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "../assets/logo.png";
import { handleGoogleDriveUrl } from "./imageHandler";

const sanitizeText = (text) => {
    if (!text) return "";
    
    // Normalize to handle decomposed characters (like combining accents)
    let sanitized = text.normalize('NFKD')
        // Strip non-printing/control characters and zero-width artifacts
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
        // Handle non-breaking spaces
        .replace(/\u00A0/g, " ")
        // Math & Greek symbols
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
        .replace(/∝/g, "prop.to")
        .replace(/′/g, "'")
        .replace(/•|\\bullet/g, "*") // Standard bullet
        // Superscripts
        .replace(/¹/g, "^1")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3")
        .replace(/⁴/g, "^4")
        .replace(/⁵/g, "^5")
        // Subscripts
        .replace(/₀|⁰/g, "0")
        .replace(/₁|¹/g, "1")
        .replace(/₂|²/g, "2")
        .replace(/₃|³/g, "3")
        .replace(/₄|⁴/g, "4")
        .replace(/₅|⁵/g, "5")
        .replace(/₆|⁶/g, "6")
        .replace(/₇|⁷/g, "7")
        .replace(/₈|⁸/g, "8")
        .replace(/₉|⁹/g, "9")
        // Clean up common leftovers from Word/Math editors
        .replace(/\\approx/g, "~")
        .replace(/\\times/g, "x")
        .replace(/\\div/g, "/")
        .trim();

    // Final pass for specific corruption: if & density is high (>25%), it's noise
    const ampersandCount = (sanitized.match(/&/g) || []).length;
    if (ampersandCount > sanitized.length * 0.25) {
        sanitized = sanitized.replace(/&/g, "");
    }

    return sanitized;
};

const addWatermark = (doc, logoData) => {
    if (!logoData) return;

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.06 }));

        const imgWidth = 100;
        const imgHeight = (logoData.height * imgWidth) / logoData.width;
        const x = (doc.internal.pageSize.width - imgWidth) / 2;
        const y = (doc.internal.pageSize.height - imgHeight) / 2;

        doc.addImage(logoData.data, 'JPEG', x, y, imgWidth, imgHeight);
        doc.restoreGraphicsState();
    }
};

export const downloadPaperAsPDF = async (paper) => {
    if (!paper) return;

    const loadImage = (url) => {
        return new Promise((resolve) => {
            if (!url) {
                resolve(null);
                return;
            }

            // Clean up URL and handle short filenames
            let finalUrl = handleGoogleDriveUrl(url);
            if (typeof finalUrl === 'string') {
                // Remove extra info in parentheses if exists
                if (finalUrl.includes('(') && finalUrl.includes(')')) {
                    finalUrl = finalUrl.split(' ')[0];
                }

                // Prepend base URL if it's just a filename
                if (!finalUrl.startsWith('http') && !finalUrl.startsWith('data:') && !finalUrl.startsWith('/')) {
                    finalUrl = `https://datapro.in/uploads/${finalUrl}`;
                }
            }

            const img = new Image();
            img.crossOrigin = 'Anonymous';

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve({
                        data: canvas.toDataURL('image/jpeg', 0.8),
                        width: img.width,
                        height: img.height
                    });
                } catch (error) {
                    console.error("Error converting image:", error);
                    resolve(null);
                }
            };

            img.onerror = (error) => {
                console.error("Failed to load image:", finalUrl, error);
                resolve(null);
            };

            // Add cache buster to avoid CORS issues
            img.src = finalUrl + (finalUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        });
    };

    const doc = new jsPDF();
    let yPos = 15;
    const logoData = await loadImage(logo);

    // Header - University Name
    doc.setFontSize(11);
    doc.setFont("times", 'bold');
    doc.text("Uttaranchal University", 105, yPos, { align: 'center' });
    yPos += 5;

    doc.setFontSize(10);
    doc.setFont("times", 'normal');
    doc.text("Uttaranchal Institute of Technology", 105, yPos, { align: 'center' });
    yPos += 5;

    // Semester Title (paper.title or paper.semester)
    doc.setFontSize(10);
    doc.setFont("times", 'bold');
    const displayTitle = String(paper.title ? paper.title.replace(/ - Set [A-Z]/gi, "") : (paper.semester || "Semester"));
    doc.text(displayTitle, 105, yPos, { align: 'center' });
    yPos += 5;

    // Department Title
    doc.setFontSize(10);
    doc.setFont("times", 'bold');
    const deptTitle = (paper.department || "").toUpperCase();
    doc.text(deptTitle, 105, yPos, { align: 'center' });
    yPos += 6;

    // Draw Set A/B Indicator in Circle at top right
    const setMatch = (paper.title || "").match(/Set ([A-Z])/i);
    if (setMatch) {
        const setLetter = setMatch[1].toUpperCase();
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.circle(185, 15, 7, 'S'); // 'S' for stroke
        doc.setFontSize(10);
        doc.setFont("times", 'bold');
        doc.text(setLetter, 185, 15.5, { align: 'center' }); // Centered in circle
        doc.text("SET", 185, 25, { align: 'center' }); // label below circle
    }

    // Draw lines for border
    doc.setLineWidth(0.3);
    doc.line(15, yPos, 195, yPos);
    yPos += 4;

    const metaY = yPos;
    doc.setFontSize(9);

    // Line 1
    doc.setFont("times", "bolditalic");
    doc.text("Programme:", 20, metaY);
    doc.setFont("times", 'normal');
    doc.text(String(paper.program || "B.Tech"), 45, metaY);

    doc.setFont("times", "bolditalic");
    doc.text("Course Code:", 120, metaY);
    doc.setFont("times", 'normal');
    const courseCode = (paper.subjectCode || "").toUpperCase();
    doc.text(courseCode, 145, metaY);

    // Line 2
    doc.setFont("times", "bolditalic");
    doc.text("Course:", 20, metaY + 4);
    doc.setFont("times", 'normal');
    const courseName = (paper.subjectName || "").toUpperCase();
    doc.text(courseName, 45, metaY + 4);

    doc.setFont("times", "bolditalic");
    doc.text("Section:", 120, metaY + 4);
    doc.setFont("times", 'normal');
    const paperSection = (paper.section || "A/B/C").toUpperCase();
    doc.text(paperSection, 145, metaY + 4);

    // Line 3
    doc.setFont("times", "bolditalic");
    doc.text("Roll No:", 20, metaY + 8);
    doc.setFont("times", 'normal');
    doc.text("................................................................................", 45, metaY + 8);

    // Line bottom of header
    doc.line(15, metaY + 11, 195, metaY + 11);

    // Instructions and meta
    const afterBoxY = metaY + 16;
    doc.setFontSize(9);
    doc.setFont("times", 'bold');

    // Add Time and Max Marks
    const formatDurationInMinutes = (durationInHours) => {
        if (typeof durationInHours !== 'number') return 'N/A';
        return durationInHours * 60;
    };
    doc.setFont("times", 'normal');
    doc.text(`Time: ${formatDurationInMinutes(paper.duration)} Minutes`, 20, afterBoxY + 5);
    doc.text(`Max Marks: ${paper.totalMarks || 30}`, 190, afterBoxY + 5, { align: 'right' });

    const uniqueMarks = new Set([...paper.questions].map(q => q.marks)).size;
    const numSectionsText = ["one", "two", "three", "four", "five", "six"][uniqueMarks - 1] || uniqueMarks;
    doc.text(`Note: Question Paper has ${numSectionsText} sections. Read carefully before answering.`, 20, afterBoxY);

    const sortedQuestions = [...paper.questions].sort((a, b) => a.marks - b.marks);
    let currentMark = null;
    let groupIndex = 0;
    let questionIndex = 0;
    let contentY = afterBoxY + 10;

    for (let i = 0; i < sortedQuestions.length; i++) {
        const q = sortedQuestions[i];

        // Calculate dimensions first
        const bloomTag = q.bloomLevel ? `[${q.bloomLevel}]` : "";
        const questionText = sanitizeText(q.question || '');
        const questionLines = doc.splitTextToSize(questionText, 115);
        const lineHeight = 3.6;
        let textHeight = questionLines.length * lineHeight;

        let orQuestionLines = [];
        if (q.orQuestion && q.orQuestion.question) {
            orQuestionLines = doc.splitTextToSize(sanitizeText(q.orQuestion.question), 115);
            textHeight += (orQuestionLines.length * lineHeight) + 6;
        }
        const optionsHeight = (q.options?.length || 0) * lineHeight;

        let imageHeight = 0;
        let imageData = null;
        if (q.imageURL) {
            imageData = await loadImage(q.imageURL);
            if (imageData) {
                // Scale image to max width of 100mm, maintain aspect ratio
                const maxW = 100;
                const ratio = imageData.height / imageData.width;
                imageHeight = Math.min(60, maxW * ratio); // Max height 60mm
                imageData.displayW = imageHeight / ratio;
            }
        }

        const questionBlockHeight = textHeight + optionsHeight + (imageHeight ? imageHeight + 10 : 0) + 10;

        let headerBlockHeight = 0;
        let isNewGroup = false;

        // Check for new group
        if (q.marks !== currentMark) {
            currentMark = q.marks;
            isNewGroup = true;
            headerBlockHeight = 15; // Header space
        }

        // Check if we need a page break
        if (contentY + headerBlockHeight + questionBlockHeight > 285) {
            doc.addPage();
            contentY = 20;
        }

        // Print Group Header if needed
        if (isNewGroup) {
            const groupLabel = String.fromCharCode(65 + groupIndex); // A, B, C...

            let typeDesc = "Questions";
            if (q.marks <= 2) typeDesc = "Very Short Answer Type Questions";
            else if (q.marks <= 4) typeDesc = "Short Answer Type Questions";
            else typeDesc = "Long Answer Type Questions";

            doc.setFontSize(10);
            doc.setFont("times", 'bold');
            doc.text(`Section- ${groupLabel} (${typeDesc})`, 105, contentY, { align: 'center' });
            contentY += 5;

            doc.setFontSize(9);
            doc.text(`Q. ${groupIndex + 1}: Attempt all Questions    ( ${q.marks} marks each )`, 20, contentY);

            doc.setFontSize(8);
            doc.text("Course Outcome", 150, contentY, { align: 'center' });
            doc.text("BT", 185, contentY, { align: 'center' });

            contentY += 5;
            groupIndex++;
            questionIndex = 0;
        }

        // Print Question
        doc.setFontSize(9);
        doc.setFont("times", 'bold');
        doc.text(`${String.fromCharCode(97 + questionIndex)}.`, 20, contentY);
        questionIndex++;

        doc.setFont("times", 'normal');
        
        // Use a non-global regex for the test to avoid lastIndex issues in loops
        const hasUrl = /(https?:\/\/[^\s]+)/.test(q.question || "");
        
        if (hasUrl) {
            doc.setTextColor(37, 99, 235); // Blue-600
        }
        
        // Render each line of the question
        questionLines.forEach((line, idx) => {
            doc.text(line, 28, contentY + (idx * 3.6));
        });

        // Reset color for identifiers
        doc.setTextColor(0, 0, 0);

        // Print CO and BT columns - align with the first line
        const tagColor = hasUrl ? [59, 130, 246] : [85, 85, 85];
        doc.setTextColor(tagColor[0], tagColor[1], tagColor[2]);
        doc.setFontSize(8);
        doc.text(String(q.co || ""), 150, contentY, { align: 'center' });
        doc.text(String(q.bloomLevel || 'RE').toUpperCase(), 185, contentY, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);


        if (q.orQuestion && q.orQuestion.question) {
            let currentBaseY = contentY + (questionLines.length * 3.6) + 1;
            doc.setFont("times", 'bold');
            doc.text("OR", 105, currentBaseY, { align: 'center' });
            currentBaseY += 4;
            doc.setFont("times", 'normal');
            
            const orHasUrl = /(https?:\/\/[^\s]+)/.test(q.orQuestion.question || "");
            if (orHasUrl) {
                doc.setTextColor(37, 99, 235);
            }
            
            orQuestionLines.forEach((line, idx) => {
                doc.text(line, 28, currentBaseY + (idx * 3.6));
            });
            
            doc.setTextColor(0, 0, 0);

            // Print OR question CO and BT columns
            const orTagColor = orHasUrl ? [59, 130, 246] : [85, 85, 85];
            doc.setTextColor(orTagColor[0], orTagColor[1], orTagColor[2]);
            doc.setFontSize(8);
            doc.text(String(q.orQuestion.co || ""), 150, currentBaseY, { align: 'center' });
            doc.text(String(q.orQuestion.bloomLevel || 'RE').toUpperCase(), 185, currentBaseY, { align: 'center' });
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
        }

        contentY += textHeight + 1;

        // Print Options
        if (q.options && q.options.length > 0) {
            doc.setFontSize(8);
            q.options.forEach((opt, optIdx) => {
                if (contentY > 285) {
                    doc.addPage();
                    contentY = 20;
                }
                doc.text(`${String.fromCharCode(65 + optIdx)}) ${opt}`, 40, contentY);
                contentY += lineHeight;
            });
        }

        // Print Image
        if (imageData) {
            if (contentY + imageHeight > 285) {
                doc.addPage();
                contentY = 20;
            }
            doc.addImage(imageData.data, 'JPEG', 40, contentY, imageData.displayW, imageHeight);
            contentY += imageHeight + 8;
        }

        // Print OR Image if exists
        if (q.orQuestion?.imageURL) {
            const orImageData = await loadImage(q.orQuestion.imageURL);
            if (orImageData) {
                const maxW = 100;
                const ratio = orImageData.height / orImageData.width;
                const orImageHeight = Math.min(60, maxW * ratio);
                const orDisplayW = orImageHeight / ratio;

                if (contentY + orImageHeight > 285) {
                    doc.addPage();
                    contentY = 20;
                }
                doc.addImage(orImageData.data, 'JPEG', 40, contentY, orDisplayW, orImageHeight);
                contentY += orImageHeight + 8;
            }
        }

        contentY += 2; // Spacing between questions
    }

    // Finalize: Add watermark to all pages before saving
    addWatermark(doc, logoData);

    doc.save(`${String(paper.title || 'Question_Paper').replace(/\s+/g, '_')}.pdf`);
};
