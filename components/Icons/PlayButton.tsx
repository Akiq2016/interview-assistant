import React from "react";
import styled from "styled-components";

const StyledPlayButtonO = styled.i`
  & {
    box-sizing: border-box;
    position: relative;
    display: block;
    transform: scale(var(--ggs, 1));
    width: 22px;
    height: 22px;
    border: 2px solid;
    border-radius: 20px;
  }
  &::before {
    content: "";
    display: block;
    box-sizing: border-box;
    position: absolute;
    width: 0;
    height: 10px;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 6px solid;
    top: 4px;
    left: 7px;
  }
`;

const Icon = (
  props: React.HTMLAttributes<HTMLElement>,
  ref: React.ForwardedRef<HTMLElement>
) => {
  return (
    <>
      <StyledPlayButtonO {...props} ref={ref} icon-role="play-button-o" />
    </>
  );
};

export const PlayButtonO = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(Icon);
