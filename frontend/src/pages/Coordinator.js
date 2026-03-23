import { useState, useEffect } from "react";
import usePopup from "../hooks/usePopup";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Coordinator() {
  const [classes,setClasses]=useState([]);
  const [name,setName]=useState("");
  const [expiresAt,setExpiresAt]=useState("");
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
      background: '#ffffff',
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
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(124,92,191,0.12)',
        padding: '40px',
        border: '2px solid #d1c4e9',
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#8a76b7',
          marginBottom: '40px',
          fontSize: '36px',
          fontWeight: '700',
          letterSpacing: '1px',
        }}>Coordinator Dashboard</h2>

        <Popup />
        <div style={{
          marginBottom: '40px',
          backgroundColor: '#f3f0fa',
          padding: '32px',
          borderRadius: '12px',
          border: '1px solid #d1c4e9',
        }}>
          <h3 style={{
            marginBottom: '20px',
            color: '#7c5cbf',
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
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#7c5cbf' }}>Class Name <span style={{ color: '#dc3545' }}>*</span></label>
              <input
                placeholder="Class Name"
                value={name}
                onChange={e=>setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '2px solid #d1c4e9',
                  borderRadius: '8px',
                  fontSize: '17px',
                  transition: 'border-color 0.3s',
                  outline: 'none',
                  background: '#fff',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#7c5cbf'}
                onBlur={(e) => e.target.style.borderColor = '#d1c4e9'}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#7c5cbf' }}>Class Expiry <span style={{ color: '#dc3545' }}>*</span></label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e=>setExpiresAt(e.target.value)}
                min={minExpiryDateTime}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '2px solid #d1c4e9',
                  borderRadius: '8px',
                  fontSize: '17px',
                  transition: 'border-color 0.3s',
                  outline: 'none',
                  background: '#fff',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#7c5cbf'}
                onBlur={(e) => e.target.style.borderColor = '#d1c4e9'}
              />
            </div>
            <button
              onClick={createClass}
              style={{
                padding: '14px 32px',
                backgroundColor: '#7c5cbf',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '17px',
                fontWeight: '700',
                transition: 'background-color 0.3s',
                letterSpacing: '0.5px',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#6a4fb3'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#7c5cbf'}
            >
              Create Class
            </button>
          </div>
          {expiresAt && (
            <p style={{
              margin: '0',
              color: '#7c5cbf',
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
          color: '#7c5cbf',
          fontSize: '24px',
          fontWeight: '700',
          letterSpacing: '0.5px',
        }}>Your Classes</h3>
        {classes.length === 0 ? (
          <p style={{
            color: '#7c5cbf',
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
              <Link
                key={cls.id}
                to={`/class/${cls.id}/details`}
                style={{
                  padding: '24px',
                  backgroundColor: '#f3f0fa',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '2px solid #d1c4e9',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(124,92,191,0.08)',
                  display: 'block',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#e3e9fc';
                  e.currentTarget.style.borderColor = '#7c5cbf';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,92,191,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#f3f0fa';
                  e.currentTarget.style.borderColor = '#d1c4e9';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,92,191,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h4 style={{
                  margin: '0 0 10px 0',
                  color: '#7c5cbf',
                  fontSize: '22px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                }}>{cls.name}</h4>
                <p style={{
                  margin: '5px 0',
                  fontSize: '16px',
                  color: '#555',
                  fontWeight: '500',
                }}>
                  <strong>Join Code:</strong> <span style={{
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#7c5cbf',
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



