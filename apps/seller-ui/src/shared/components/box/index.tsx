'use client';

import styled from "styled-components";

interface BoxProps {
    css?:React.CSSProperties;
    className?:string;
}

const Box = styled.div
    .withConfig({
        // Keep the `css` prop as our own API — don't leak it to the DOM.
        shouldForwardProp: (prop) => prop !== "css",
    })
    .attrs<BoxProps>((props) => ({
        style: props.css,
    }))<BoxProps>`
    box-sizing: border-box;
`;

export default Box;