import imgBackgroundBorder from "figma:asset/60ca6ac43f8bf1e7e62198c20b7cf14c5c12714e.png";
import imgBackgroundBorder1 from "figma:asset/fc94cbadc3095fd9e23205aeb9ba62f7a5018a80.png";
import { imgSvg } from "./svg-90w1s";
import Frame50 from "./Frame50";

function Svg() {
  return (
    <div className="relative shrink-0 size-5" data-name="SVG">
      <Frame50 />
    </div>
  );
}

function Overlay() {
  return (
    <div
      className="bg-[rgba(250,250,250,0.1)] box-border content-stretch flex flex-col items-start justify-start p-[8px] relative rounded-[10px] flex-shrink-0"
      data-name="Overlay"
    >
      <Svg />
    </div>
  );
}

function Container() {
  return (
    <div
      className="content-stretch flex flex-col items-start justify-start relative"
      data-name="Container"
    >
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative text-[18px] text-neutral-50">
        <p className="leading-[24px] text-[14px] md:text-base pt-[0px] pr-[0px] pb-[0px] pl-[8px] md:pl-0">
          Welcome to Talindrew! Start by exploring a sample
          sequence or search our database.
        </p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div
      className="content-stretch flex gap-2 md:gap-4 items-center justify-start relative w-full min-w-0"
      data-name="Container"
    >
      <Overlay />
      <Container />
    </div>
  );
}

export default function BackgroundBorder() {
  return (
    <div
      className="bg-[position:50%_50%,_50%_50%,_0%_0%] bg-gradient-to-r bg-size-[cover,cover,auto] from-[#1b1b1db3] relative rounded-[14px] size-full to-[#1b1b1de6]"
      data-name="Background+Border"
      style={{
        backgroundImage: `url('${imgBackgroundBorder}'), url('${imgBackgroundBorder1}')`,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute border border-[#292929] border-solid inset-0 pointer-events-none rounded-[14px]"
      />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-4 md:p-[25px] relative size-full">
          <Container1 />
        </div>
      </div>
    </div>
  );
}