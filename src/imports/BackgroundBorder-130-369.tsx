import { imgVector, imgVector1, imgVector2 } from "./svg-zqtqh";

function ReactIconsIoIoIosArrowDown() {
  return (
    <div className="relative size-full" data-name="react-icons/io/IoIosArrowDown">
      <div className="absolute inset-[31.24%_17.21%_31.25%_17.19%]" data-name="Vector">
        <img className="block max-w-none size-full" src={imgVector} />
      </div>
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0">
      <div className="bg-[#acb0f8] rounded-[4px] shrink-0 size-5" data-name="Background" />
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-neutral-50 text-nowrap">
        <p className="leading-[28px] whitespace-pre">Sequence Features (26)</p>
      </div>
    </div>
  );
}

function Svg() {
  return (
    <div className="h-4 relative shrink-0 w-full" data-name="SVG">
      <div className="absolute inset-[8.34%_8.35%_8.35%_8.34%]" data-name="Vector">
        <div className="absolute inset-[-5.001%]">
          <img className="block max-w-none size-full" src={imgVector1} />
        </div>
      </div>
      <div className="absolute inset-[29.16%_66.67%_66.67%_29.16%]" data-name="Vector">
        <div className="absolute inset-[-100%]">
          <img className="block max-w-none size-full" src={imgVector2} />
        </div>
      </div>
    </div>
  );
}

function SvgMargin() {
  return (
    <div className="box-border content-stretch flex flex-col h-4 items-start justify-start pl-0 pr-2 py-0 relative shrink-0 w-6" data-name="SVG:margin">
      <Svg />
    </div>
  );
}

function ButtonDialog() {
  return (
    <div className="bg-neutral-50 box-border content-stretch flex gap-1 h-9 items-center justify-center px-3 py-2 relative rounded-[8px] shrink-0" data-name="Button dialog">
      <SvgMargin />
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-neutral-900 text-nowrap">
        <p className="leading-[20px] whitespace-pre">Add Annotation</p>
      </div>
    </div>
  );
}

function Heading5() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Heading 5">
      <Frame36 />
      <ButtonDialog />
    </div>
  );
}

function Container() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start pb-1.5 pt-[23.75px] px-6 relative w-full">
          <Heading5 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderShadow() {
  return (
    <div className="bg-violet-500 relative rounded-[1.67772e+07px] shrink-0 size-6" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[1.67772e+07px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]" />
    </div>
  );
}

function Margin() {
  return (
    <div className="box-border content-stretch flex flex-col h-6 items-start justify-start pl-0 pr-3 py-0 relative shrink-0 w-9" data-name="Margin">
      <BackgroundBorderShadow />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-100 text-nowrap">
        <p className="leading-[24px] whitespace-pre">ori</p>
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="bg-neutral-800 box-border content-stretch flex items-center justify-center overflow-clip px-[9px] py-[3px] relative rounded-[8px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-neutral-50 text-nowrap">
        <p className="leading-[16px] whitespace-pre">origin</p>
      </div>
    </div>
  );
}

function Border() {
  return (
    <div className="relative rounded-[8px] shrink-0" data-name="Border">
      <div className="box-border content-stretch flex items-center justify-center overflow-clip px-[9px] py-[3px] relative">
        <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-neutral-50 text-nowrap">
          <p className="leading-[16px] whitespace-pre">→ forward</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-neutral-800 border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container1 />
      <Background />
      <Border />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="content-stretch flex font-['SF_Pro_Text:Regular',_sans-serif] gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-full" data-name="Paragraph">
      <div className="flex flex-col justify-center relative shrink-0 text-[#99a1af]">
        <p className="leading-[20px] text-nowrap whitespace-pre">Position: 1,760 - 2,348</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#6a7282]">
        <p className="leading-[20px] text-nowrap whitespace-pre">(589 bp)</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col gap-[3.75px] items-start justify-start relative shrink-0" data-name="Container">
      <Container2 />
      <Paragraph />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0" data-name="Container">
      <Margin />
      <Container3 />
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#99a1af] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">45.9%</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#99a1af] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">of sequence</p>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col gap-1 items-start justify-start relative shrink-0" data-name="Container">
      <Container5 />
      <Container6 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container4 />
      <Container7 />
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="bg-[#161618] relative rounded-[10px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#364153] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[17px] relative w-full">
          <Container8 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderShadow1() {
  return (
    <div className="bg-red-500 relative rounded-[1.67772e+07px] shrink-0 size-6" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[1.67772e+07px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]" />
    </div>
  );
}

function Margin1() {
  return (
    <div className="box-border content-stretch flex flex-col h-6 items-start justify-start pl-0 pr-3 py-0 relative shrink-0 w-9" data-name="Margin">
      <BackgroundBorderShadow1 />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-100 text-nowrap">
        <p className="leading-[24px] whitespace-pre">ampR</p>
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-neutral-800 box-border content-stretch flex items-center justify-center overflow-clip px-[9px] py-[3px] relative rounded-[8px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-neutral-50 text-nowrap">
        <p className="leading-[16px] whitespace-pre">gene</p>
      </div>
    </div>
  );
}

function Border1() {
  return (
    <div className="relative rounded-[8px] shrink-0" data-name="Border">
      <div className="box-border content-stretch flex items-center justify-center overflow-clip px-[9px] py-[3px] relative">
        <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-neutral-50 text-nowrap">
          <p className="leading-[16px] whitespace-pre">← reverse</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-neutral-800 border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container9 />
      <Background1 />
      <Border1 />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="content-stretch flex font-['SF_Pro_Text:Regular',_sans-serif] gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-full" data-name="Paragraph">
      <div className="flex flex-col justify-center relative shrink-0 text-[#99a1af]">
        <p className="leading-[20px] text-nowrap whitespace-pre">Position: 610 - 1,470</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#6a7282]">
        <p className="leading-[20px] text-nowrap whitespace-pre">(861 bp)</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col gap-[3.75px] items-start justify-start relative shrink-0" data-name="Container">
      <Container10 />
      <Paragraph1 />
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0" data-name="Container">
      <Margin1 />
      <Container11 />
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#99a1af] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">67.1%</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#99a1af] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">of sequence</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col gap-1 items-start justify-start relative shrink-0" data-name="Container">
      <Container13 />
      <Container14 />
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container12 />
      <Container15 />
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="bg-[#161618] relative rounded-[10px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#364153] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[17px] relative w-full">
          <Container16 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderShadow2() {
  return (
    <div className="bg-blue-500 relative rounded-[1.67772e+07px] shrink-0 size-6" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[1.67772e+07px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]" />
    </div>
  );
}

function Margin2() {
  return (
    <div className="box-border content-stretch flex flex-col h-6 items-start justify-start pl-0 pr-3 py-0 relative shrink-0 w-9" data-name="Margin">
      <BackgroundBorderShadow2 />
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-100 text-nowrap">
        <p className="leading-[24px] whitespace-pre">lacZ α</p>
      </div>
    </div>
  );
}

function Background2() {
  return (
    <div className="bg-neutral-800 box-border content-stretch flex items-center justify-center overflow-clip px-[9px] py-[3px] relative rounded-[8px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-neutral-50 text-nowrap">
        <p className="leading-[16px] whitespace-pre">gene</p>
      </div>
    </div>
  );
}

function Border2() {
  return (
    <div className="relative rounded-[8px] shrink-0" data-name="Border">
      <div className="box-border content-stretch flex items-center justify-center overflow-clip px-[9px] py-[3px] relative">
        <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-neutral-50 text-nowrap">
          <p className="leading-[16px] whitespace-pre">→ forward</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-neutral-800 border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container17 />
      <Background2 />
      <Border2 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="content-stretch flex font-['SF_Pro_Text:Regular',_sans-serif] gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-full" data-name="Paragraph">
      <div className="flex flex-col justify-center relative shrink-0 text-[#99a1af]">
        <p className="leading-[20px] text-nowrap whitespace-pre">Position: 30 - 395</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#6a7282]">
        <p className="leading-[20px] text-nowrap whitespace-pre">(366 bp)</p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col gap-[3.75px] items-start justify-start relative shrink-0" data-name="Container">
      <Container18 />
      <Paragraph2 />
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0" data-name="Container">
      <Margin2 />
      <Container19 />
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#99a1af] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">28.5%</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#99a1af] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">of sequence</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="content-stretch flex flex-col gap-1 items-start justify-start relative shrink-0" data-name="Container">
      <Container21 />
      <Container22 />
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container20 />
      <Container23 />
    </div>
  );
}

function BackgroundBorder2() {
  return (
    <div className="bg-[#161618] relative rounded-[10px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#364153] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[17px] relative w-full">
          <Container24 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderShadow3() {
  return (
    <div className="bg-emerald-500 relative rounded-[1.67772e+07px] shrink-0 size-6" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[1.67772e+07px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]" />
    </div>
  );
}

function Margin3() {
  return (
    <div className="box-border content-stretch flex flex-col h-6 items-start justify-start pl-0 pr-3 py-0 relative shrink-0 w-9" data-name="Margin">
      <BackgroundBorderShadow3 />
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Semibold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-gray-100 text-nowrap">
        <p className="leading-[24px] whitespace-pre">lac promoter</p>
      </div>
    </div>
  );
}

function Background3() {
  return (
    <div className="bg-neutral-800 box-border content-stretch flex items-center justify-center overflow-clip px-[9px] py-[3px] relative rounded-[8px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-neutral-50 text-nowrap">
        <p className="leading-[16px] whitespace-pre">promoter</p>
      </div>
    </div>
  );
}

function Border3() {
  return (
    <div className="relative rounded-[8px] shrink-0" data-name="Border">
      <div className="box-border content-stretch flex items-center justify-center overflow-clip px-[9px] py-[3px] relative">
        <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-neutral-50 text-nowrap">
          <p className="leading-[16px] whitespace-pre">→ forward</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-neutral-800 border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0 w-full" data-name="Container">
      <Container25 />
      <Background3 />
      <Border3 />
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="content-stretch flex font-['SF_Pro_Text:Regular',_sans-serif] gap-2 items-start justify-start leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap w-full" data-name="Paragraph">
      <div className="flex flex-col justify-center relative shrink-0 text-[#99a1af]">
        <p className="leading-[20px] text-nowrap whitespace-pre">Position: 395 - 425</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[#6a7282]">
        <p className="leading-[20px] text-nowrap whitespace-pre">(31 bp)</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="content-stretch flex flex-col gap-[3.75px] items-start justify-start relative shrink-0" data-name="Container">
      <Container26 />
      <Paragraph3 />
    </div>
  );
}

function Container28() {
  return (
    <div className="content-stretch flex items-start justify-start relative shrink-0" data-name="Container">
      <Margin3 />
      <Container27 />
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#99a1af] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">2.4%</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex flex-col items-end justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['SF_Pro_Text:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#99a1af] text-[12px] text-nowrap text-right">
        <p className="leading-[16px] whitespace-pre">of sequence</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="content-stretch flex flex-col gap-1 items-start justify-start relative shrink-0" data-name="Container">
      <Container29 />
      <Container30 />
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <Container28 />
      <Container31 />
    </div>
  );
}

function BackgroundBorder3() {
  return (
    <div className="bg-[#161618] relative rounded-[10px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#364153] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[17px] relative w-full">
          <Container32 />
        </div>
      </div>
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0">
      <div className="flex h-[28.284px] items-center justify-center relative shrink-0 w-[28.284px]">
        <div className="flex-none rotate-[315deg]">
          <div className="bg-[#6c74ff] rounded-[3.757px] size-5" data-name="Background" />
        </div>
      </div>
      <div className="flex flex-col font-['SF_Pro_Text:Medium',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-nowrap text-white">
        <p className="leading-[20px] whitespace-pre">Restriction Sites (10)</p>
      </div>
    </div>
  );
}

function BackgroundBorder4() {
  return (
    <div className="bg-[#161618] relative rounded-[10px] shrink-0 w-full" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#364153] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex items-center justify-between p-[17px] relative w-full">
          <Frame34 />
          <div className="relative shrink-0 size-4" data-name="react-icons/io/IoIosArrowDown">
            <ReactIconsIoIoIosArrowDown />
          </div>
        </div>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="content-stretch flex flex-col gap-3 items-start justify-start relative shrink-0 w-full" data-name="Container">
      <BackgroundBorder />
      <BackgroundBorder1 />
      <BackgroundBorder2 />
      <BackgroundBorder3 />
      <BackgroundBorder4 />
    </div>
  );
}

function Container34() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start pb-6 pt-0 px-6 relative w-full">
          <Container33 />
        </div>
      </div>
    </div>
  );
}

export default function BackgroundBorder5() {
  return (
    <div className="bg-[#0f0f0f] relative rounded-[14px] size-full" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border-[1px_1px_1px_4px] border-neutral-800 border-solid inset-0 pointer-events-none rounded-[14px]" />
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-6 items-start justify-start pl-1 pr-px py-px relative size-full">
          <Container />
          <Container34 />
        </div>
      </div>
    </div>
  );
}