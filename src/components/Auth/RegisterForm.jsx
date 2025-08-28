import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Auth.css";

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        ist_id: "",
        name: "",
        username: "",
        password: "",
        course: "",
        email: "",
    });
    const [loading, setLoading] = useState(false);

    const { register, error } = useAuth();
    const navigate = useNavigate();

    // Parse URL parameters for Fenix OAuth data
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const istId = urlParams.get("ist_id");
        const name = urlParams.get("name");
        const email = urlParams.get("email");

        if (istId || name || email) {
            setFormData((prev) => ({
                ...prev,
                ist_id: istId || "",
                name: name || "",
                email: email || "",
                username: name ? name.split(" ")[0] : "",
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await register(formData);
            navigate("/login", {
                state: { message: "Registration successful! Please login." },
            });
        } catch (error) {
            console.error("Registration failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Register for HackerSchool</h2>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="ist_id">IST ID</label>
                        <input
                            type="text"
                            id="ist_id"
                            name="ist_id"
                            value={formData.ist_id}
                            onChange={handleChange}
                            required
                            disabled={loading || !!formData.ist_id}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="course">Course</label>
                        <select
                            id="course"
                            name="course"
                            value={formData.course}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        >
                            <option value="">Select your course</option>
                            <option value="LEIC">
                                LEIC - Computer Science and Engineering
                            </option>
                            <option value="LEIC-A">
                                LEIC-A - Computer Science and Engineering
                                (Applied)
                            </option>
                            <option value="MEIC">
                                MEIC - Computer Science and Engineering
                                (Masters)
                            </option>
                            <option value="MEIC-A">
                                MEIC-A - Computer Science and Engineering
                                (Masters Applied)
                            </option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-btn"
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account? <a href="/login">Login here</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;
