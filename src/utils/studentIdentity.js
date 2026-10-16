// CMS Clinic module — student identity helper.
// The student number comes ONLY from the existing Mother PWA session
// (set by Login.jsx). It is never read from the URL or user input.

export const getStudentNumber = () => {
    try {
        return (localStorage.getItem("idNumber") || "").trim();
    } catch {
        return "";
    }
};
