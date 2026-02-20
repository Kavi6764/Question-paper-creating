import React from 'react';

const PageContainer = ({ children, className = "" }) => {
    return (
        <div className={`min-h-screen pt-4 pb-12 px-4 sm:px-6 lg:px-8 animate-fade-in ${className}`}>
            <div className="max-w-7xl mx-auto space-y-6">
                {children}
            </div>
        </div>
    );
};

export default PageContainer;
