import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../fireBaseConfig';
import { Printer, Loader2 } from 'lucide-react';

export default function QuestionPaperView() {
  const { id } = useParams();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const docRef = doc(db, 'questionPapers', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPaper({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching paper:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPaper();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!paper) {
    return <div className="text-center p-10">Paper not found</div>;
  }

  // Group questions by Unit
  const questionsByUnit = paper.questions.reduce((acc, q) => {
    const unit = q.unit || 1;
    if (!acc[unit]) acc[unit] = [];
    acc[unit].push(q);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      {/* Print Button - Hidden in Print Mode */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"
        >
          <Printer size={20} />
          Print / Save as PDF
        </button>
      </div>

      {/* Exam Paper Layout */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg p-10 print:shadow-none print:max-w-none print:p-0">
        
        {/* Header */}
        <div className="text-center border-b-2 border-gray-900 pb-6 mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">University / Institute Name</h1>
          <h2 className="text-xl font-semibold mb-4">{paper.title}</h2>
          
          <div className="flex justify-between text-sm font-medium mt-4 px-4">
            <div className="text-left space-y-1">
              <p>Subject Code: {paper.subjectCode}</p>
              <p>Subject Name: {paper.subjectName}</p>
            </div>
            <div className="text-right space-y-1">
              <p>Date: {paper.publicationDate}</p>
              <p>Max Marks: {paper.totalMarks}</p>
              <p>Duration: 3 Hours</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8 text-sm italic border-b border-gray-300 pb-4">
          <p className="font-bold not-italic mb-1">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Answer all questions from Part A.</li>
            <li>Answer any 5 questions from Part B.</li>
            <li>Draw diagrams wherever necessary.</li>
          </ul>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {Object.keys(questionsByUnit).sort().map((unit) => (
            <div key={unit} className="break-inside-avoid">
              <h3 className="text-lg font-bold border-b border-gray-400 pb-2 mb-4">
                Unit {unit}
              </h3>
              <div className="space-y-6">
                {questionsByUnit[unit].map((q, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="font-medium min-w-[30px]">{q.questionNo || `Q${idx+1}`}.</span>
                    <div className="flex-1">
                      <p className="text-justify">{q.question}</p>
                    </div>
                    <span className="font-semibold text-right min-w-[40px]">
                      [{q.marks}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-900 text-center text-sm font-bold">
          *** End of Question Paper ***
        </div>

      </div>
    </div>
  );
}
