import React from 'react';
import { forwardRef } from 'react';

interface BaseProps{
    label?: string;
    type?: "text" | "number" | "password" | "email" | "textarea";
    className?: string;
}

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type Props = InputProps | TextareaProps;
const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(({label,type = "text",className, ...props},ref) => {
    
  return (
    <div className='w-full'>
        {label && (
            <label className='block font-semibold text-gray-300 mb-1'>
                {label}
            </label>
        )}
        {type === "textarea" ? (
            <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`w-full rounded-md p-2 border-gray-700 outline-none bg-transparent text-white ${className}`}
            {...(props as TextareaProps)}
            />
        ): (
            <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            className={`w-full rounded-md p-2 border-gray-700 outline-none bg-transparent text-white ${className}`}
            {...(props as InputProps)}
            />
        )}

    </div>
  )
})

Input.displayName = "Input"

export default Input

// Parent

// <Input
//     label="Description"
//     type="textarea"
//     rows={5}
//     ref={textareaRef}
// />

//         │
//         ▼

// Input Component

// label?
//  │
//  ▼
// Render label

// type === textarea?
//         │
//    Yes──┴──No
//    │         │
// <textarea> <input>

// Pass all remaining props

// Attach ref

// Return JSX