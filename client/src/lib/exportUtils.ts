export function exportDataAsJSON(data: any, filename = "healthify_export.json") {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

export function generateClinicalSummaryPDF(userProfile: any, records: any[]) {
    // We achieve a lightweight PDF by opening a temporary print window
    // This perfectly supports "Save as PDF" across modern mobile and web browsers
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Clinical Summary - ${userProfile?.name || 'Patient'}</title>
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; }
                h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
                .section { margin-top: 30px; }
                .section-title { font-size: 18px; font-weight: bold; color: #334155; margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 6px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
                th { background-color: #f1f5f9; font-weight: 600; }
                .footer { margin-top: 50px; font-size: 12px; color: #64748b; text-align: center; font-style: italic; }
            </style>
        </head>
        <body>
            <h1>Healthify Clinical Summary</h1>
            <p><strong>Patient Name:</strong> ${userProfile?.name || 'N/A'}</p>
            <p><strong>Age:</strong> ${userProfile?.age || 'N/A'}</p>
            <p><strong>Blood Group:</strong> ${userProfile?.bloodGroup || 'N/A'}</p>
            <p><strong>Known Conditions:</strong> ${(userProfile?.diseases || []).join(", ") || 'None reported'}</p>
            <p><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</p>
            
            <div class="section">
                <div class="section-title">Health Records Inventory</div>
                ${records.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Document Title</th>
                            <th>Category</th>
                            <th>Doctor</th>
                            <th>Uploaded Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(r => `
                            <tr>
                                <td>${r.title}</td>
                                <td>${r.category}</td>
                                <td>${r.doctor || 'Self'}</td>
                                <td>${new Date(r.uploadedAt).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : '<p>No health records on file.</p>'}
            </div>

            <div class="section">
                <div class="section-title">Pro Mode: Advanced Health Analytics</div>
                ${(userProfile?.cardiacRisk || userProfile?.diabetesRisk || userProfile?.mentalScore || userProfile?.lifestyleScore) ? `
                <table>
                    <thead>
                        <tr>
                            <th>Health Metric</th>
                            <th>Score / Risk Level</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userProfile?.cardiacRisk ? `
                        <tr>
                            <td>Cardiovascular Risk</td>
                            <td>${userProfile.cardiacRisk}%</td>
                            <td>${parseInt(userProfile.cardiacRisk) > 40 ? 'Action Required' : 'Optimal'}</td>
                        </tr>` : ''}
                        ${userProfile?.diabetesRisk ? `
                        <tr>
                            <td>Type 2 Diabetes Risk</td>
                            <td>${userProfile.diabetesRisk}%</td>
                            <td>${parseInt(userProfile.diabetesRisk) > 40 ? 'Action Required' : 'Optimal'}</td>
                        </tr>` : ''}
                        ${userProfile?.mentalScore ? `
                        <tr>
                            <td>Mental Wellness Score</td>
                            <td>${userProfile.mentalScore}/100</td>
                            <td>${parseInt(userProfile.mentalScore) < 60 ? 'Needs Attention' : 'Healthy'}</td>
                        </tr>` : ''}
                        ${userProfile?.lifestyleScore ? `
                        <tr>
                            <td>Daily Habits & Lifestyle</td>
                            <td>${userProfile.lifestyleScore}/100</td>
                            <td>${parseInt(userProfile.lifestyleScore) < 60 ? 'Needs Attention' : 'Healthy'}</td>
                        </tr>` : ''}
                    </tbody>
                </table>
                ` : '<p>No advanced Pro Mode metrics recorded yet. Complete assessments to unlock AI insights.</p>'}
            </div>

            <div class="footer">
                Automatically generated by Healthify.<br/>
                This is a structured export meant for physician review or personal backup.
            </div>
            <script>
                // Auto-print when loaded
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
