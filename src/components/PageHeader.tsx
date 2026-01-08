interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="bg-[#e5e5f4] relative w-full h-[200px] sm:h-[250px] lg:h-[305px] overflow-hidden flex flex-col justify-center items-center">
      <div className="relative z-10 px-4">
        <h1 className="text-[#191d23] text-[32px] sm:text-[48px] lg:text-[64px] font-semibold font-archivo text-center leading-tight">
          {title}
        </h1>
      </div>
    </div>
  );
}
