import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
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

      {/* Formatting Function */}
      {(() => {
        const formatDurationInMinutes = (duration) => {
          if (!duration) return "180";
          let str = duration.toString();
          if (str.includes('.') || str.includes(':')) {
            let parts = str.split(/[.:]/);
            let hours = parseInt(parts[0]) || 0;
            let minsPart = parts[1] || "0";
            if (minsPart === '5' || minsPart === '50') {
              return (hours * 60 + 30).toString();
            } else {
              let mins = parseInt(minsPart.padEnd(2, '0').slice(0, 2)) || 0;
              return (hours * 60 + mins).toString();
            }
          } else {
            return (parseInt(str) * 60).toString();
          }
        };

        return (
          <div className="max-w-4xl mx-auto bg-white shadow-lg p-10 print:shadow-none print:max-w-none print:p-0">

            {/* Header */}
            <div className="text-center mb-6">
              <div className="border border-gray-900 rounded p-4 mb-4 font-serif text-[15px] font-bold">
                <h1 className="text-xl uppercase tracking-wider mb-1">Uttarakhand University</h1>
                <h2 className="text-lg font-normal mb-1">Uttaranchal Institute of Technology</h2>
                <h3 className="text-base mb-3">{paper.title ? paper.title.replace(/ - Set [A-Z]/gi, "") : ""}</h3>

                <div className="text-left w-full mt-2 font-normal">
                  <div className="flex justify-between mb-1">
                    <div className="flex gap-2 w-1/2">
                      <span className="italic font-bold">Programme:</span>
                      <span>{paper.department || "B. Tech (CSE)"}</span>
                    </div>
                    <div className="flex gap-2 w-1/2">
                      <span className="italic font-bold">Semester:</span>
                      <span>{paper.semester || "5th"}</span>
                    </div>
                  </div>
                  <div className="flex justify-between mb-1">
                    <div className="flex gap-2 w-1/2">
                      <span className="italic font-bold">Course:</span>
                      <span className="uppercase">{paper.subjectName || "FULL STACK DEVELOPMENT"}</span>
                    </div>
                    <div className="flex gap-2 w-1/2">
                      <span className="italic font-bold">Course Code:</span>
                      <span className="uppercase">{paper.subjectCode || "TCS 300"}</span>
                    </div>
                  </div>
                  <div className="flex justify-between mb-1">
                    <div className="flex gap-2 w-1/2">
                      <span className="italic font-bold">Section:</span>
                      <span>A/B/C</span>
                    </div>
                    <div className="flex gap-2 w-1/2">
                      <span className="italic font-bold">Roll No:</span>
                      <span>..............................</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="font-serif text-[14px] font-bold text-left mb-2">
                <p>Note: Question Paper has {Object.keys(questionsByUnit).length || 3} sections. Read carefully before answering.</p>
              </div>
              <div className="flex justify-between font-serif text-[15px] font-bold mb-4">
                <span>Time: {formatDurationInMinutes(paper.duration)} Minutes</span>
                <span>Max Marks: {paper.totalMarks || 30}</span>
              </div>
            </div>

            {/* Instructions */}
            {/* Instructions Removed as requested by specific header pattern */}

            {/* Questions */}
            <div className="space-y-8">
              {Object.keys(questionsByUnit).sort().map((unit) => (
                <div key={unit} className="break-inside-avoid">
                  <h3 className="text-lg font-bold border-b border-gray-400 pb-2 mb-4">
                    Unit {unit}
                  </h3>
                  <div className="space-y-6">
                    {questionsByUnit[unit].map((q, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <span className="font-medium min-w-[30px]">{String.fromCharCode(97 + idx)}.</span>
                        <div className="flex-1">
                          <p className="text-justify">{q.question}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 min-w-[60px]">
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-50 text-gray-500 border border-gray-200 uppercase tracking-tighter">
                            {q.bloomLevel || 'RE'}
                          </span>
                          <span className="font-semibold text-right">
                            [{q.marks}]
                          </span>
                        </div>
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
        );
      })()}
    </div>
  );
}
