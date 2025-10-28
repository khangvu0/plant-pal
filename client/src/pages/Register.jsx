import { useState } from 'react';
import axios from 'axios';
import '../styles/Register.css';
import Button from '../components/Button';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
    });

    const [agreeTerms, setAgreeTerms] = useState(false);
    const [errors, setErrors] = useState({});
    const [validFields, setValidFields] = useState({});
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Regex patterns
    const nameRegex = /^[a-zA-Z]{2,12}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Handle field change and live border validation
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Border feedback only
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
            case 'first_name':
                if (!nameRegex.test(value)) {
                    error = 'First name must be 2–12 letters.';
                } else valid = true;
                break;
            case 'last_name':
                if (!nameRegex.test(value)) {
                    error = 'Last name must be 2–12 letters.';
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

        // Store only border color feedback for live validation
        setValidFields((prev) => ({ ...prev, [name]: valid }));

        // Only update errors when showErrors = true (on submit)
        if (showErrors) {
            setErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    // Validate full form on submit
    const validateForm = () => {
        const newErrors = {};
        Object.entries(formData).forEach(([name, value]) => {
            let error = '';
            switch (name) {
                case 'email':
                    if (!emailRegex.test(value))
                        error = 'Please enter a valid email address.';
                    break;
                case 'first_name':
                    if (!nameRegex.test(value))
                        error = 'First name must be 2–12 letters.';
                    break;
                case 'last_name':
                    if (!nameRegex.test(value))
                        error = 'Last name must be 2–12 letters.';
                    break;
                case 'password':
                    if (value.trim().length < 6 || value.length > 30)
                        error = 'Password must be between 6–30 characters.';
                    break;
                default:
                    break;
            }
            if (error) newErrors[name] = error;
        });

        if (!agreeTerms) newErrors.terms = 'You must agree to the terms';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);

        const isValid = validateForm();
        if (!isValid) return;

        try {
            const res = await axios.post('/api/register', formData);
            setMessage(res.data.message || 'Account created successfully!');

            // Reset
            setErrors({});
            setValidFields({});
            setFormData({
                email: '',
                first_name: '',
                last_name: '',
                password: '',
            });
            setAgreeTerms(false);
            setSubmitted(false);
        } catch (err) {
            setMessage('Registration failed. Please try again.');
            console.error(err);
        }
    };

    // Get border-only validation class
    const getInputClass = (name) => {
        if (validFields[name] === true) return 'input-valid';
        if (validFields[name] === false && formData[name])
            return 'input-invalid';
        return '';
    };

    return (
        <form
            id="registerForm"
            className="register--form"
            onSubmit={handleSubmit}>
            <h2 className="form--title">Create an Account</h2>
            {message && <div id="message">{message}</div>}

            <div className="register--your-info">
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
                        <div className="register--error">{errors.email}</div>
                    )}
                </div>

                {/* First Name */}
                <div className="form--group">
                    <label htmlFor="first_name">First Name</label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="John"
                        className={getInputClass('first_name')}
                    />
                    {submitted && errors.first_name && (
                        <div className="register--error">
                            {errors.first_name}
                        </div>
                    )}
                </div>

                {/* Last Name */}
                <div className="form--group">
                    <label htmlFor="last_name">Last Name</label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Doe"
                        className={getInputClass('last_name')}
                    />
                    {submitted && errors.last_name && (
                        <div className="register--error">
                            {errors.last_name}
                        </div>
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
                        <div className="register--error">{errors.password}</div>
                    )}
                </div>

                {/* Terms */}
                <div className="form--group">
                    <div className="register--form__checkbox">
                        <input
                            type="checkbox"
                            id="agree-terms"
                            checked={agreeTerms}
                            onChange={() => setAgreeTerms(!agreeTerms)}
                        />
                        <label htmlFor="agree-terms">
                            Agree to{' '}
                            <a
                                href="/terms"
                                target="_blank"
                                rel="noopener noreferrer">
                                Terms & Conditions
                            </a>
                        </label>
                    </div>
                    {submitted && errors.terms && (
                        <div className="register--error">{errors.terms}</div>
                    )}
                </div>

                <Button size="large" type="submit">
                    Register
                </Button>
            </div>
        </form>
    );
}
