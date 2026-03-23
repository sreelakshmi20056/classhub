import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import ResetPassword from "./pages/ResetPassword";
import Student from "./pages/Student";
import StudentClassPage from "./pages/StudentClassPage";
import Teacher from "./pages/Teacher";
import TeacherClassPage from "./pages/TeacherClassPage";
import SubjectNotesPage from "./pages/SubjectNotesPage";
import SubjectAssignmentsPage from "./pages/SubjectAssignmentsPage";
import SubjectAnnouncementsPage from "./pages/SubjectAnnouncementsPage";
import StudentSubjectPage from "./pages/StudentSubjectPage";
import CoordinatorClassPage from "./pages/CoordinatorClassPage";
import AssignmentSubmissionsPage from "./pages/AssignmentSubmissionsPage";
import Coordinator from "./pages/Coordinator";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/student"
          element={
            <RequireAuth>
              <Student />
            </RequireAuth>
          }
        />
        <Route
          path="/student/class/:id"
          element={
            <RequireAuth>
              <StudentClassPage />
            </RequireAuth>
          }
        />
        <Route
          path="/teacher"
          element={
            <RequireAuth>
              <Teacher />
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/class/:id"
          element={
            <RequireAuth>
              <TeacherClassPage />
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/class/:id/subject/:subjectId/notes"
          element={
            <RequireAuth>
              <SubjectNotesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/class/:id/subject/:subjectId/assignments"
          element={
            <RequireAuth>
              <SubjectAssignmentsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/class/:id/subject/:subjectId/announcements"
          element={
            <RequireAuth>
              <SubjectAnnouncementsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/student/class/:id/subject/:subjectId"
          element={
            <RequireAuth>
              <StudentSubjectPage />
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/assignment/:id/submissions"
          element={
            <RequireAuth>
              <AssignmentSubmissionsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/student/assignment/:id/submissions"
          element={
            <RequireAuth>
              <AssignmentSubmissionsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/coordinator"
          element={
            <RequireAuth>
              <Coordinator />
            </RequireAuth>
          }
        />
        <Route
          path="/class/:id/details"
          element={
            <RequireAuth>
              <CoordinatorClassPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
