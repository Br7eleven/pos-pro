import { InputHTMLAttributes, forwardRef } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...rest }, ref) => (
  <div className={styles.wrap}>
    {label && <label className={styles.label}>{label}</label>}
    <input
      ref={ref}
      className={[styles.input, error ? styles.error : '', className].filter(Boolean).join(' ')}
      {...rest}
    />
    {error && <span className={styles.errorText}>{error}</span>}
  </div>
))

Input.displayName = 'Input'
