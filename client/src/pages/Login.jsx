import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import Button from '../components/Button';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [errors, setErrors] = useState({});
    const [validFields, setValidFields] = useState({});
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Regex for email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Handle field change and live border validation
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        validateField(name, value, false);
    };

    // Validate single field (used for live and full validation)
    const validateField = (name, value, showErrors = true) => {
        let error = '';
        let valid = false;

        switch (name) {
            case 'email':
                if (!emailRegex.test(value)) {
                    error = 'Please enter a valid email address.';
                } else valid = true;
                break;
            case 'password':
                if (value.trim().length < 6 || value.length > 30) {
                    error = 'Password must be between 6–30 characters.';
                } else valid = true;
                break;
            default:
                break;
        }

        setValidFields((prev) => ({ ...prev, [name]: valid }));

        if (showErrors) {
            setErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    // Validate all fields on submit
    const validateForm = () => {
        const newErrors = {};

        if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        if (
            formData.password.trim().length < 6 ||
            formData.password.length > 30
        ) {
            newErrors.password = 'Password must be between 6–30 characters.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);

        const isValid = validateForm();
        if (!isValid) return;

        const result = await login(formData.email, formData.password);
        
        if (result.success) {
            setMessage(result.message);
            // Navigate to dashboard after successful login
            navigate('/dashboard');
        } else {
            setMessage(result.message);
        }
    };

    const getInputClass = (name) => {
        if (validFields[name] === true) return 'input-valid';
        if (validFields[name] === false && formData[name])
            return 'input-invalid';
        return '';
    };

    return (
        <form id="loginForm" className="login--form" onSubmit={handleSubmit}>
            <h2 className="form--title">Login</h2>
            {message && <div id="message">{message}</div>}

            <div className="login--your-info">
                {/* Email */}
                <div className="form--group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@gmail.com"
                        className={getInputClass('email')}
                    />
                    {submitted && errors.email && (
                        <div className="login--error">{errors.email}</div>
                    )}
                </div>

                {/* Password */}
                <div className="form--group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        maxLength="30"
                        className={getInputClass('password')}
                    />
                    {submitted && errors.password && (
                        <div className="login--error">{errors.password}</div>
                    )}
                </div>

                <Button size="large" type="submit">
                    Login
                </Button>
            </div>
        </form>
    );
}
