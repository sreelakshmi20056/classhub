import { useState, useEffect } from "react";
import usePopup from "../hooks/usePopup";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Coordinator() {
  const [classes,setClasses]=useState([]);
  const [name,setName]=useState("");
  const [expiresAt,setExpiresAt]=useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [Popup, showPopup] = usePopup();
  const navigate = useNavigate();

  const formatDateTimeLocal = (date) => {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const getTomorrowStart = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  const minExpiryDateTime = formatDateTimeLocal(getTomorrowStart());

  const fetchClasses=async()=>{
    const res=await API.get("/classes/created");
    setClasses(res.data);
  };

  const confirmDeleteClass = async () => {
    if (!deleteTarget?.id) return;
    try {
      await API.delete(`/classes/${deleteTarget.id}`);
      showPopup("Class deleted successfully");
      setDeleteTarget(null);
      fetchClasses();
    } catch (err) {
      console.error("Failed to delete class", err);
      showPopup(err.response?.data?.message || "Failed to delete class");
    }
  };

  const requestDeleteClass = (classId, className) => {
    setDeleteTarget({ id: classId, name: className });
  };

  const createClass=async()=>{
    if (!name.trim()) {
      showPopup("Please enter a class name");
      return;
    }
    if (!expiresAt) {
      showPopup("Please set an expiration date and time");
      return;
    }

    const selectedExpiry = new Date(expiresAt);
    const selectedDateOnly = new Date(selectedExpiry);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDateOnly <= today) {
      showPopup("Class expiry must be from tomorrow onwards");
      return;
    }

    try {
      await API.post("/classes/create",{name, expires_at: expiresAt});
      fetchClasses();
      showPopup("Class created successfully");
    } catch (err) {
      console.error("Failed to create class", err);
      showPopup(err.response?.data?.message || "Failed to create class");
    } finally {
      // Clear fields after popup disappears (3000ms timeout), whether success or error
      setTimeout(() => {
        setName("");
        setExpiresAt("");
      }, 3000);
    }
  };

  useEffect(()=>{
    fetchClasses();
  },[]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 18% 16%, rgba(99, 82, 235, 0.2) 0%, rgba(99, 82, 235, 0) 42%), radial-gradient(circle at 82% 20%, rgba(202, 92, 255, 0.2) 0%, rgba(202, 92, 255, 0) 34%), linear-gradient(130deg, #0b1333 0%, #11193d 56%, #1a1740 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: 'rgba(10, 18, 43, 0.78)',
        borderRadius: '16px',
        boxShadow: '0 26px 56px rgba(3, 8, 28, 0.56)',
        padding: '40px',
        border: '1px solid #253261',
        backdropFilter: 'blur(10px)',
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#d7deff',
          marginBottom: '40px',
          fontSize: '36px',
          fontWeight: '700',
          letterSpacing: '1px',
        }}>Coordinator Dashboard</h2>

        <Popup />
        {deleteTarget && (
          <div style={{
            marginBottom: '20px',
            backgroundColor: 'rgba(220, 53, 69, 0.12)',
            border: '1px solid rgba(220, 53, 69, 0.55)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#ffc7d0', fontWeight: 600, fontSize: '14px' }}>
              Are you sure you want to delete class "{deleteTarget.name}"? This will remove it for all joined teachers and students.
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={confirmDeleteClass}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dc3545',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #2d3a66',
                  backgroundColor: '#121e47',
                  color: '#d7deff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div style={{
          marginBottom: '40px',
          backgroundColor: '#131f49',
          padding: '32px',
          borderRadius: '12px',
          border: '1px solid #2d3a66',
        }}>
          <h3 style={{
            marginBottom: '20px',
            color: '#c7ceff',
            fontSize: '24px',
            fontWeight: '700',
            letterSpacing: '0.5px',
          }}>Create New Class</h3>
          <div style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#bfc7ed' }}>Class Name <span style={{ color: '#ff6f97' }}>*</span></label>
              <input
                placeholder="Class Name"
                value={name}
                onChange={e=>setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '2px solid #2d3a66',
                  borderRadius: '8px',
                  fontSize: '17px',
                  transition: 'border-color 0.3s',
                  outline: 'none',
                  background: '#101a3c',
                  color: '#eef2ff',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#8f7cff'}
                onBlur={(e) => e.target.style.borderColor = '#2d3a66'}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#bfc7ed' }}>Class Expiry <span style={{ color: '#ff6f97' }}>*</span></label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e=>setExpiresAt(e.target.value)}
                min={minExpiryDateTime}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '2px solid #2d3a66',
                  borderRadius: '8px',
                  fontSize: '17px',
                  transition: 'border-color 0.3s',
                  outline: 'none',
                  background: '#101a3c',
                  color: '#eef2ff',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#8f7cff'}
                onBlur={(e) => e.target.style.borderColor = '#2d3a66'}
              />
            </div>
            <button
              onClick={createClass}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '17px',
                fontWeight: '700',
                transition: 'background-color 0.3s',
                letterSpacing: '0.5px',
                boxShadow: '0 10px 28px rgba(123, 104, 255, 0.4)',
              }}
              onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #5f5fee 0%, #8649ff 100%)'}
              onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #6d6cf7 0%, #915dff 100%)'}
            >
              Create Class
            </button>
          </div>
          {expiresAt && (
            <p style={{
              margin: '0',
              color: '#9ca8d3',
              fontSize: '15px',
              fontStyle: 'italic',
              fontWeight: '500',
            }}>
              Class will expire on: {new Date(expiresAt).toLocaleDateString()} at {new Date(expiresAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        <h3 style={{
          marginBottom: '20px',
          color: '#c7ceff',
          fontSize: '24px',
          fontWeight: '700',
          letterSpacing: '0.5px',
        }}>Your Classes</h3>
        {classes.length === 0 ? (
          <p style={{
            color: '#9ca8d3',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '40px',
            fontSize: '18px',
            fontWeight: '500',
          }}>No classes created yet</p>
        ) : (
          <div style={{
            display: 'grid',
            gap: '24px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          }}>
            {classes.map(cls=>(
              <div
                key={cls.id}
                onClick={() => navigate(`/class/${cls.id}/details`)}
                style={{
                  position: 'relative',
                  padding: '24px',
                  backgroundColor: '#131f49',
                  borderRadius: '12px',
                  color: 'inherit',
                  border: '1px solid #2d3a66',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 24px rgba(3, 8, 28, 0.45)',
                  display: 'block',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#1a2a5f';
                  e.currentTarget.style.borderColor = '#8f7cff';
                  e.currentTarget.style.boxShadow = '0 14px 30px rgba(3, 8, 28, 0.55)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#131f49';
                  e.currentTarget.style.borderColor = '#2d3a66';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(3, 8, 28, 0.45)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDeleteClass(cls.id, cls.name);
                  }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.12)',
                    color: '#ff9cac',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
                <h4 style={{
                  margin: '0 0 10px 0',
                  color: '#d7deff',
                  fontSize: '22px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                }}>{cls.name}</h4>
                <p style={{
                  margin: '5px 0',
                  fontSize: '16px',
                  color: '#b7c1e8',
                  fontWeight: '500',
                }}>
                  <strong>Join Code:</strong> <span style={{
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#8f7cff',
                  }}>{cls.join_code}</span>
                </p>
                {cls.expires_at && (
                  <p style={{
                    margin: '5px 0 0 0',
                    color: '#dc3545',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}>
                    <strong>Expires:</strong> {new Date(cls.expires_at).toLocaleDateString()} at {new Date(cls.expires_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



