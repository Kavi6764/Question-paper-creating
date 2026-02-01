import React, { useState } from "react";
import { auth, db } from "../../fireBaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export default function SeedAdmin() {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const admins = [
    {
      email: "hod@exam.com",
      password: "Password@123",
      username: "hod",
      fullName: "Head of Department",
      role: "hod"
    },
    {
      email: "dean@exam.com",
      password: "Password@123",
      username: "dean",
      fullName: "Dean of Engineering",
      role: "dean"
    }
  ];

  const handleSeed = async () => {
    setIsLoading(true);
    setStatus("Starting process...");
    
    try {
      for (const admin of admins) {
        setStatus(`Creating ${admin.role}...`);
        
        try {
          // 1. Create Auth User
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            admin.email,
            admin.password
          );
          
          // 2. Create Firestore Doc
          await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: admin.email,
            username: admin.username,
            fullName: admin.fullName,
            role: admin.role,
            status: "active",
            emailVerified: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          setStatus((prev) => prev + `\nSuccess: ${admin.role} created.`);
        } catch (error) {
           if (error.code === 'auth/email-already-in-use') {
             setStatus((prev) => prev + `\nSkipped: ${admin.role} already exists.`);
           } else {
             throw error;
           }
        }
      }
      toast.success("Admins seeded successfully!");
      setStatus((prev) => prev + "\nDONE!");
    } catch (error) {
      console.error(error);
      setStatus((prev) => prev + `\nError: ${error.message}`);
      toast.error("Failed to seed admins");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Seeding Tool</h1>
      <pre className="bg-gray-100 p-4 rounded mb-4 text-sm min-h-[100px] whitespace-pre-wrap">
        {status || "Ready to seed..."}
      </pre>
      <button 
        onClick={handleSeed}
        disabled={isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? "Processing..." : "Create Admin Users"}
      </button>
    </div>
  );
}
