import { imgGroup2, imgSvgMargin, imgFrame54, imgFrame55 } from "./svg-u247m";

function Container() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a1a1a1] text-[16px] w-full">
        <p className="leading-[24px]">Try sample sequences to explore Talindrew features:</p>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="h-[12.908px] relative shrink-0 w-[13.964px]">
      <img className="block max-w-none size-full" src={imgGroup2} />
    </div>
  );
}

function SvgMargin() {
  return (
    <div className="box-border content-stretch flex flex-col h-4 items-start justify-start pl-0 pr-2 py-0 relative shrink-0 w-6" data-name="SVG:margin">
      <Group2 />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#161618] h-12 relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#292929] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex gap-2 h-12 items-center justify-start pl-[13px] pr-[452.39px] py-[9px] relative w-full">
          <SvgMargin />
          <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-neutral-50 text-nowrap">
            <p className="leading-[20px] whitespace-pre">Plasmid (pUC19)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SvgMargin1() {
  return (
    <div className="h-4 relative shrink-0 w-6" data-name="SVG:margin">
      <img className="block max-w-none size-full" src={imgSvgMargin} />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#161618] h-12 relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#292929] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex gap-2 h-12 items-center justify-start pl-[13px] pr-[512.67px] py-[9px] relative w-full">
          <SvgMargin1 />
          <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-white">
            <p className="leading-[20px] whitespace-pre">Sickle Cell Sequence</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame54() {
  return (
    <div className="h-4 relative shrink-0 w-[16.462px]">
      <img className="block max-w-none size-full" src={imgFrame54} />
    </div>
  );
}

function SvgMargin2() {
  return (
    <div className="box-border content-stretch flex flex-col h-4 items-start justify-start pl-0 pr-2 py-0 relative shrink-0 w-6" data-name="SVG:margin">
      <Frame54 />
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#161618] h-12 relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#292929] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex gap-2 h-12 items-center justify-start pl-[13px] pr-[487.59px] py-[9px] relative w-full">
          <SvgMargin2 />
          <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-white">
            <p className="leading-[20px] whitespace-pre">Cystic Fibrosis Sequence</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame55() {
  return (
    <div className="h-4 relative shrink-0 w-[21.023px]">
      <img className="block max-w-none size-full" src={imgFrame55} />
    </div>
  );
}

function SvgMargin3() {
  return (
    <div className="box-border content-stretch flex flex-col h-4 items-start justify-center pl-0 pr-2 py-0 relative shrink-0 w-6" data-name="SVG:margin">
      <Frame55 />
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-[#161618] h-12 relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#292929] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex gap-2 h-12 items-center justify-start pl-[13px] pr-[500.94px] py-[9px] relative w-full">
          <SvgMargin3 />
          <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-white">
            <p className="leading-[20px] whitespace-pre">{`Huntington's Sequence`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col gap-3 items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Button />
      <Button1 />
      <Button2 />
      <Button3 />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col gap-4 items-start justify-start relative shrink-0 w-full" data-name="Container">
      <Container />
      <Container1 />
    </div>
  );
}

export default function Container3() {
  return (
    <div className="relative size-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start pb-6 pt-0 px-6 relative size-full">
          <Container2 />
        </div>
      </div>
    </div>
  );
}