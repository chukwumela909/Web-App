"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Asset URLs from Figma
const imgAdd = "https://www.figma.com/api/mcp/asset/a1f513a2-6b8d-4742-8b0e-1fdf058a69f7";
const imgKeyboardArrowDown = "https://www.figma.com/api/mcp/asset/91404009-7fb0-4fc1-bca3-2cffcf2e2ddd";
const imgDeployedCode = "https://www.figma.com/api/mcp/asset/ed74c868-a0b6-4594-adc5-5b7c31ef685e";
const imgVisibility = "https://www.figma.com/api/mcp/asset/66168f36-a7c3-4648-be73-27c456ed5d5a";
const imgEdit = "https://www.figma.com/api/mcp/asset/49190261-b814-453b-9e80-39c0f2eb6bcb";
const imgSearch = "https://www.figma.com/api/mcp/asset/b422c0a9-3f7b-47b5-a10b-5d6d2770f0dc";
const imgDelete = "https://www.figma.com/api/mcp/asset/e5436fd6-4477-4629-95b7-2853b3fc5f88";
const imgDeployedCode1 = "https://www.figma.com/api/mcp/asset/c75ec331-d1f5-4afc-ae7b-d5a03df4f706";
const imgVisibility1 = "https://www.figma.com/api/mcp/asset/d0312632-07b4-4275-83d3-db8a97c1003b";
const imgEdit1 = "https://www.figma.com/api/mcp/asset/f779e7a4-32bd-4a7d-a56b-651dd334420b";
const imgSearch1 = "https://www.figma.com/api/mcp/asset/f64efea6-1661-497f-84f9-ee2ef28f165c";
const imgDelete1 = "https://www.figma.com/api/mcp/asset/211b4699-5929-45e4-872c-1c43cb5424b5";
const imgDeployedCode2 = "https://www.figma.com/api/mcp/asset/72452d43-467c-4d93-b89a-b1735494415e";
const imgVisibility2 = "https://www.figma.com/api/mcp/asset/75010b89-2776-4898-8441-32b1c4ac3929";
const imgEdit2 = "https://www.figma.com/api/mcp/asset/f58ece94-83c1-4fba-a212-921b0acef0ab";
const imgSearch2 = "https://www.figma.com/api/mcp/asset/30030deb-da3a-4424-9c50-db9c7cfdf567";
const imgDelete2 = "https://www.figma.com/api/mcp/asset/74e681e4-3cae-41bb-89a5-0f2b432e5cdd";
const imgDeployedCode3 = "https://www.figma.com/api/mcp/asset/445cbb1b-56c7-4725-ad79-b6235f552ee9";
const imgVisibility3 = "https://www.figma.com/api/mcp/asset/7cc4599a-5b04-4e3b-a01d-cffbfca075db";
const imgEdit3 = "https://www.figma.com/api/mcp/asset/9e8fa478-95d9-4672-a53f-2232f1c1e9e4";
const imgSearch3 = "https://www.figma.com/api/mcp/asset/e13d0115-21dd-483f-a4e0-a1e10749f3bc";
const imgDelete3 = "https://www.figma.com/api/mcp/asset/1e8949c5-336c-4f70-bafd-facd03189b33";
const imgArrowBack = "https://www.figma.com/api/mcp/asset/6d396239-c558-44b5-a9f8-c25be825cf37";
const imgDeployedCode4 = "https://www.figma.com/api/mcp/asset/e67a653d-8d15-4ecd-9106-65dce19b5d81";
const imgVisibility4 = "https://www.figma.com/api/mcp/asset/15215d7d-e430-4725-9ae7-8a97865f5d0d";
const imgEdit4 = "https://www.figma.com/api/mcp/asset/da3256a1-7b11-453e-8da9-7e559bcc6f79";
const imgSearch4 = "https://www.figma.com/api/mcp/asset/6194420a-c47e-4ae7-9c0b-5b810b19ef06";
const imgDelete4 = "https://www.figma.com/api/mcp/asset/7f80baad-fee5-482a-93ef-fbfb332c0126";

export function StockDashboardMockup() {
  return (
    <div className="relative w-[586px] h-[482px] scale-[0.5] sm:scale-[0.6] md:scale-[0.8] lg:scale-100 origin-top-left">
      <div className="absolute bg-[#f8f8f9] border-4 border-[#71717a] border-solid h-[575.91px] left-0 overflow-clip rounded-[30px] top-[112px] w-[809.874px]">
        <div className="absolute content-stretch flex flex-col gap-[5.624px] items-start leading-[normal] left-[15.12px] not-italic top-[55.62px] w-[112.482px] whitespace-pre-wrap">
          <p className="font-bold relative shrink-0 text-[#09090b] text-[13.498px] w-full">
            Browse Products
          </p>
          <p className="font-medium relative shrink-0 text-[#71717a] text-[8.999px] w-full">
            Showing 9 of 9 products
          </p>
        </div>
        <div className="absolute bg-[#004aad] content-stretch flex gap-[5.624px] items-center justify-center left-[690.02px] px-[11.248px] py-[5.624px] rounded-[5.624px] top-[12.87px]">
          <div className="relative shrink-0 size-[13.498px]">
            <img alt="" className="block max-w-none size-full" src={imgAdd} />
          </div>
          <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[8.999px] text-white">
            Add Product
          </p>
        </div>
        <div className="absolute bg-white border-[#d9d9e0] border-[0.562px] border-solid content-stretch flex flex-col gap-[10.686px] h-[123.731px] items-start left-[16.25px] p-[11.248px] rounded-[8.999px] top-[106.23px] w-[769.38px]">
          <div className="border-[#d9d9e0] border-[0.562px] border-solid content-stretch flex items-center pb-[9.561px] pt-[10.123px] px-[22.496px] relative rounded-[5.624px] shrink-0 w-[733.385px]">
            <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#71717a] text-[8.999px]">
              Search products by name, SKU, category, barcode, or tags..
            </p>
          </div>
          <div className="content-stretch flex gap-[8.999px] items-center relative shrink-0">
            <div className="bg-[#004aad] content-stretch flex items-center justify-center p-[5.624px] relative rounded-[5.624px] shrink-0">
              <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[8.999px] text-white w-[74.238px] whitespace-pre-wrap">
                All Products (9)
              </p>
            </div>
            <div className="bg-[#f4f4f5] content-stretch flex items-center justify-center px-[6.749px] py-[5.624px] relative rounded-[5.624px] shrink-0">
              <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#71717a] text-[8.999px]">
                In Stock (9)
              </p>
            </div>
            <div className="bg-[#f4f4f5] content-stretch flex items-center justify-center px-[6.749px] py-[5.624px] relative rounded-[5.624px] shrink-0">
              <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#71717a] text-[8.999px]">
                Low Stock (0)
              </p>
            </div>
            <div className="bg-[#f4f4f5] content-stretch flex items-center justify-center px-[6.749px] py-[5.624px] relative rounded-[5.624px] shrink-0">
              <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#71717a] text-[8.999px]">
                Out of Stock (0)
              </p>
            </div>
            <div className="bg-[#f4f4f5] content-stretch flex items-center justify-center px-[6.749px] py-[5.624px] relative rounded-[5.624px] shrink-0">
              <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#71717a] text-[8.999px]">
                With Suppliers (0)
              </p>
            </div>
            <div className="bg-[#f4f4f5] content-stretch flex items-center justify-center px-[6.749px] py-[5.624px] relative rounded-[5.624px] shrink-0">
              <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#71717a] text-[8.999px]">
                No Suppliers (9)
              </p>
            </div>
            <div className="bg-[#f4f4f5] content-stretch flex items-center justify-center px-[6.749px] py-[5.624px] relative rounded-[5.624px] shrink-0">
              <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#71717a] text-[8.999px]">
                Expiring Soon (0)
              </p>
            </div>
          </div>
          <div className="border-[#d9d9e0] border-[0.562px] border-solid content-stretch flex gap-[5.624px] items-center pl-[11.248px] pr-[2.812px] py-[6.749px] relative rounded-[5.624px] shrink-0 w-[119.231px]">
            <p className="flex-[1_0_0] font-medium leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#71717a] text-[8.999px] whitespace-pre-wrap">
              All Categories
            </p>
            <div className="relative shrink-0 size-[13.498px]">
              <img alt="" className="block max-w-none size-full" src={imgKeyboardArrowDown} />
            </div>
          </div>
        </div>
        <div className="absolute content-stretch flex gap-[15.748px] items-center left-[16.25px] top-[250.77px]">
          <div className="bg-white border-[#d9d9e0] border-[0.562px] border-solid content-stretch flex flex-col gap-[11.248px] h-[241.837px] items-start p-[11.248px] relative rounded-[8.999px] shrink-0 w-[180.534px]">
            <div className="bg-[#f4f4f5] content-stretch flex gap-[5.624px] h-[103.484px] items-center justify-center px-[28.121px] py-[34.87px] relative rounded-[8.999px] shrink-0 w-full">
              <div className="relative shrink-0 size-[33.745px]">
                <img alt="" className="block max-w-none size-full" src={imgDeployedCode} />
              </div>
              <div className="absolute bg-[#dbfce7] content-stretch flex items-center justify-center left-[5.62px] px-[5.624px] py-[3.374px] rounded-[13.498px] top-[5.62px]">
                <p className="font-semibold leading-[normal] not-italic relative shrink-0 text-[#00a63e] text-[8.999px]">
                  In Stock
                </p>
              </div>
            </div>
            <div className="content-stretch flex items-end justify-between leading-[normal] not-italic relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[4.499px] items-start relative shrink-0 w-[53.429px] whitespace-pre-wrap">
                <p className="font-semibold relative shrink-0 text-[#09090b] text-[11.248px] w-full">
                  iPhone 16
                </p>
                <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[10.123px] w-full">
                  Gadgets
                </p>
              </div>
              <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[10.123px]">
                SKU: 0354E3E2
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[4.499px] items-start leading-[normal] relative shrink-0 w-[209.217px] whitespace-pre-wrap">
              <p className="font-semibold not-italic relative shrink-0 text-[#09090b] text-[13.498px] w-full">
                Ksh 115,000
              </p>
              <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[7.874px] w-full">
                Stock: 20 pcs
              </p>
            </div>
            <div className="border-[#e2e2f0] border-b-0 border-l-0 border-r-0 border-solid border-t-[0.562px] content-stretch flex items-center justify-between pb-0 pt-[8.999px] px-0 relative shrink-0 w-full">
              <div className="content-stretch flex gap-[2.25px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgVisibility} />
                </div>
                <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#004aad] text-[8.999px]">
                  View Details
                </p>
              </div>
              <div className="content-stretch flex gap-[11.248px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgEdit} />
                </div>
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgSearch} />
                </div>
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgDelete} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#d9d9e0] border-[0.562px] border-solid content-stretch flex flex-col gap-[11.248px] h-[241.837px] items-start p-[11.248px] relative rounded-[8.999px] shrink-0 w-[180.534px]">
            <div className="bg-[#f4f4f5] content-stretch flex gap-[5.624px] h-[103.484px] items-center justify-center px-[28.121px] py-[34.87px] relative rounded-[8.999px] shrink-0 w-full">
              <div className="relative shrink-0 size-[33.745px]">
                <img alt="" className="block max-w-none size-full" src={imgDeployedCode1} />
              </div>
              <div className="absolute bg-[#dbfce7] content-stretch flex items-center justify-center left-[5.62px] px-[5.624px] py-[3.374px] rounded-[13.498px] top-[5.62px]">
                <p className="font-semibold leading-[normal] not-italic relative shrink-0 text-[#00a63e] text-[8.999px]">
                  In Stock
                </p>
              </div>
            </div>
            <div className="content-stretch flex items-end justify-between leading-[normal] not-italic relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[4.499px] items-start relative shrink-0 w-[53.429px] whitespace-pre-wrap">
                <p className="font-semibold relative shrink-0 text-[#09090b] text-[11.248px] w-full">
                  iPhone 16
                </p>
                <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[10.123px] w-full">
                  Gadgets
                </p>
              </div>
              <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[10.123px]">
                SKU: 0354E3E2
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[4.499px] items-start leading-[normal] relative shrink-0 w-[209.217px] whitespace-pre-wrap">
              <p className="font-semibold not-italic relative shrink-0 text-[#09090b] text-[13.498px] w-full">
                Ksh 115,000
              </p>
              <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[7.874px] w-full">
                Stock: 20 pcs
              </p>
            </div>
            <div className="border-[#e2e2f0] border-b-0 border-l-0 border-r-0 border-solid border-t-[0.562px] content-stretch flex items-center justify-between pb-0 pt-[8.999px] px-0 relative shrink-0 w-full">
              <div className="content-stretch flex gap-[2.25px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgVisibility1} />
                </div>
                <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#004aad] text-[8.999px]">
                  View Details
                </p>
              </div>
              <div className="content-stretch flex gap-[11.248px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgEdit1} />
                </div>
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgSearch1} />
                </div>
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgDelete1} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#d9d9e0] border-[0.562px] border-solid content-stretch flex flex-col gap-[11.248px] h-[241.837px] items-start p-[11.248px] relative rounded-[8.999px] shrink-0 w-[180.534px]">
            <div className="bg-[#f4f4f5] content-stretch flex gap-[5.624px] h-[103.484px] items-center justify-center px-[28.121px] py-[34.87px] relative rounded-[8.999px] shrink-0 w-full">
              <div className="relative shrink-0 size-[33.745px]">
                <img alt="" className="block max-w-none size-full" src={imgDeployedCode2} />
              </div>
              <div className="absolute bg-[#dbfce7] content-stretch flex items-center justify-center left-[5.62px] px-[5.624px] py-[3.374px] rounded-[13.498px] top-[5.62px]">
                <p className="font-semibold leading-[normal] not-italic relative shrink-0 text-[#00a63e] text-[8.999px]">
                  In Stock
                </p>
              </div>
            </div>
            <div className="content-stretch flex items-end justify-between leading-[normal] not-italic relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[4.499px] items-start relative shrink-0 w-[53.429px] whitespace-pre-wrap">
                <p className="font-semibold relative shrink-0 text-[#09090b] text-[11.248px] w-full">
                  iPhone 16
                </p>
                <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[10.123px] w-full">
                  Gadgets
                </p>
              </div>
              <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[10.123px]">
                SKU: 0354E3E2
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[4.499px] items-start leading-[normal] relative shrink-0 w-[209.217px] whitespace-pre-wrap">
              <p className="font-semibold not-italic relative shrink-0 text-[#09090b] text-[13.498px] w-full">
                Ksh 115,000
              </p>
              <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[7.874px] w-full">
                Stock: 20 pcs
              </p>
            </div>
            <div className="border-[#e2e2f0] border-b-0 border-l-0 border-r-0 border-solid border-t-[0.562px] content-stretch flex items-center justify-between pb-0 pt-[8.999px] px-0 relative shrink-0 w-full">
              <div className="content-stretch flex gap-[2.25px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgVisibility2} />
                </div>
                <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#004aad] text-[8.999px]">
                  View Details
                </p>
              </div>
              <div className="content-stretch flex gap-[11.248px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgEdit2} />
                </div>
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgSearch2} />
                </div>
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgDelete2} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border-[#d9d9e0] border-[0.562px] border-solid content-stretch flex flex-col gap-[11.248px] h-[241.837px] items-start p-[11.248px] relative rounded-[8.999px] shrink-0 w-[180.534px]">
            <div className="bg-[#f4f4f5] content-stretch flex gap-[5.624px] h-[103.484px] items-center justify-center px-[28.121px] py-[34.87px] relative rounded-[8.999px] shrink-0 w-full">
              <div className="relative shrink-0 size-[33.745px]">
                <img alt="" className="block max-w-none size-full" src={imgDeployedCode3} />
              </div>
              <div className="absolute bg-[#dbfce7] content-stretch flex items-center justify-center left-[5.62px] px-[5.624px] py-[3.374px] rounded-[13.498px] top-[5.62px]">
                <p className="font-semibold leading-[normal] not-italic relative shrink-0 text-[#00a63e] text-[8.999px]">
                  In Stock
                </p>
              </div>
            </div>
            <div className="content-stretch flex items-end justify-between leading-[normal] not-italic relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[4.499px] items-start relative shrink-0 w-[53.429px] whitespace-pre-wrap">
                <p className="font-semibold relative shrink-0 text-[#09090b] text-[11.248px] w-full">
                  iPhone 16
                </p>
                <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[10.123px] w-full">
                  Gadgets
                </p>
              </div>
              <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[10.123px]">
                SKU: 0354E3E2
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[4.499px] items-start leading-[normal] relative shrink-0 w-[209.217px] whitespace-pre-wrap">
              <p className="font-semibold not-italic relative shrink-0 text-[#09090b] text-[13.498px] w-full">
                Ksh 115,000
              </p>
              <p className="font-normal relative shrink-0 text-[#d9d9e0] text-[7.874px] w-full">
                Stock: 20 pcs
              </p>
            </div>
            <div className="border-[#e2e2f0] border-b-0 border-l-0 border-r-0 border-solid border-t-[0.562px] content-stretch flex items-center justify-between pb-0 pt-[8.999px] px-0 relative shrink-0 w-full">
              <div className="content-stretch flex gap-[2.25px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgVisibility3} />
                </div>
                <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#004aad] text-[8.999px]">
                  View Details
                </p>
              </div>
              <div className="content-stretch flex gap-[11.248px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgEdit3} />
                </div>
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgSearch3} />
                </div>
                <div className="relative shrink-0 size-[11.248px]">
                  <img alt="" className="block max-w-none size-full" src={imgDelete3} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute content-stretch flex gap-[5.624px] items-center left-[23.56px] top-[19.06px]">
          <div className="relative shrink-0 size-[13.498px]">
            <img alt="" className="block max-w-none size-full" src={imgArrowBack} />
          </div>
          <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#71717a] text-[8.999px]">
            Back to Products
          </p>
        </div>
      </div>
      <div className="absolute bg-white content-stretch flex flex-col gap-[20px] h-[430px] items-start left-1/2 p-[20px] rounded-[24px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] top-0 translate-x-[-50%] w-[412px]">
        <div className="bg-[#f4f4f5] content-stretch flex gap-[10px] h-[184px] items-center px-[156px] py-[62px] relative rounded-[16px] shrink-0 w-[372px]">
          <div className="relative shrink-0 size-[60px]">
            <img alt="" className="block max-w-none size-full" src={imgDeployedCode4} />
          </div>
          <div className="absolute bg-[#dbfce7] content-stretch flex items-center justify-center left-[10px] px-[10px] py-[6px] rounded-[24px] top-[10px]">
            <p className="font-semibold leading-[normal] not-italic relative shrink-0 text-[#00a63e] text-[16px]">
              In Stock
            </p>
          </div>
        </div>
        <div className="content-stretch flex items-end justify-between leading-[normal] not-italic relative shrink-0 w-[372px]">
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[95px] whitespace-pre-wrap">
            <p className="font-semibold relative shrink-0 text-[#09090b] text-[20px] w-full">
              iPhone 16
            </p>
            <p className="font-normal relative shrink-0 text-[#71717a] text-[18px] w-full">
              Gadgets
            </p>
          </div>
          <p className="font-normal relative shrink-0 text-[#71717a] text-[18px]">
            SKU: 0354E3E2
          </p>
        </div>
        <div className="content-stretch flex flex-col gap-[8px] items-start leading-[normal] relative shrink-0 w-[372px] whitespace-pre-wrap">
          <p className="font-semibold not-italic relative shrink-0 text-[#09090b] text-[24px] w-full">
            Ksh 115,000
          </p>
          <p className="font-normal relative shrink-0 text-[#71717a] text-[14px] w-full">
            Stock: 20 pcs
          </p>
        </div>
        <div className="border-[#e2e2f0] border-b-0 border-l-0 border-r-0 border-solid border-t content-stretch flex items-center justify-between pb-0 pt-[16px] px-0 relative shrink-0 w-[372px]">
          <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
            <div className="relative shrink-0 size-[20px]">
              <img alt="" className="block max-w-none size-full" src={imgVisibility4} />
            </div>
            <p className="font-medium leading-[normal] not-italic relative shrink-0 text-[#004aad] text-[16px]">
              View Details
            </p>
          </div>
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0">
            <div className="relative shrink-0 size-[20px]">
              <img alt="" className="block max-w-none size-full" src={imgEdit4} />
            </div>
            <div className="relative shrink-0 size-[20px]">
              <img alt="" className="block max-w-none size-full" src={imgSearch4} />
            </div>
            <div className="relative shrink-0 size-[20px]">
              <img alt="" className="block max-w-none size-full" src={imgDelete4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  imageSrc?: string;
  mobileImageSrc?: string;
  className?: string;
  bgColor?: string;
}

export function ProductCard({ title, description, children, imageSrc, mobileImageSrc, className, bgColor = "bg-[#e6effc]" }: ProductCardProps) {
  return (
    <div className={cn("relative w-full rounded-[24px] overflow-hidden ", bgColor, className)}>
      <div className="flex flex-col lg:flex-row h-full ">
        {/* Left Side - Text Content */}
        <div className="flex flex-col justify-center gap-6 p-8 lg:p-[60px] z-10 lg:w-[45%] shrink-0">
          <div className="flex flex-col gap-4">
            <h3 className="font-inter font-medium text-[28px] lg:mb-8 lg:text-[42px] leading-[1.2] tracking-[-1px] text-[#001031]">
              {title}
            </h3>
            <p className="font-inter font-normal text-[16px] lg:mb-8 leading-[24px] tracking-[-0.4px] text-[#001031] max-w-[400px]">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[#004aad] font-inter font-semibold text-[16px] tracking-[-0.4px] cursor-pointer hover:gap-2 transition-all mt-2">
            Get Started
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
        
        {/* Right Side - Mockup */}
        <div className="flex-1 relative min-h-[300px] lg:min-h-[480px]">
          {/* Mobile Image */}
          {mobileImageSrc && (
            <div className="absolute top-0 bottom-0 right-0 left-8 lg:hidden">
              <Image 
                src={mobileImageSrc} 
                alt={title} 
                fill 
                className="object-contain object-right-bottom"
              />
            </div>
          )}

          {/* Desktop Content */}
          <div className={cn("absolute inset-0", mobileImageSrc ? "hidden lg:block" : "")}>
            {children ? (
              <div className="absolute inset-0 flex items-center justify-center lg:justify-end">
                {children}
              </div>
            ) : imageSrc ? (
              <div className="absolute inset-0 flex items-end justify-end">
                <div className="relative w-full h-[75%]">
                  <Image 
                    src={imageSrc} 
                    alt={title} 
                    fill 
                    
                    className="object-contain object-right-bottom"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inventory Card Mockup Component matching Figma design exactly
export function InventoryCardMockup() {
  return (
    <div className="relative h-full w-full">
      {/* Background Dashboard - positioned to extend beyond card */}
      <div className="absolute h-[290px] right-[-14px] lg:right-[-14px] top-[180px] lg:top-[140px] w-[406px] scale-[0.65] lg:scale-[0.72] origin-top-right">
        <div className="bg-[#f8f8f9] border-[2px] border-[#71717a] border-solid overflow-clip rounded-[15px] w-full h-full">
          {/* Dashboard Header */}
          <div className="flex flex-col gap-[3px] items-start left-[8px] top-[28px] absolute w-[56px]">
            <p className="font-bold text-[#09090b] text-[7px]">Browse Products</p>
            <p className="font-medium text-[#71717a] text-[5px]">Showing 9 of 9 products</p>
          </div>
          
          {/* Add Product Button */}
          <div className="absolute bg-[#004aad] flex gap-[3px] items-center justify-center right-[15px] px-[6px] py-[3px] rounded-[3px] top-[6px]">
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.5 1.5V5.5M1.5 3.5H5.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <p className="font-medium text-[5px] text-white">Add Product</p>
          </div>
          
          {/* Back Arrow */}
          <div className="absolute flex gap-[3px] items-center left-[12px] top-[10px]">
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 1.5L2 3.5L4.5 5.5" stroke="#71717a" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="font-medium text-[#71717a] text-[5px]">Back to Products</p>
          </div>
          
          {/* Search Section */}
          <div className="absolute bg-white border-[0.3px] border-[#d9d9e0] border-solid flex flex-col gap-[5px] left-[8px] p-[6px] rounded-[5px] top-[53px] w-[386px]">
            <div className="border-[0.3px] border-[#d9d9e0] border-solid flex items-center py-[5px] px-[11px] rounded-[3px] w-[368px]">
              <p className="font-medium text-[#71717a] text-[5px]">Search products by name, SKU, category, barcode, or tags..</p>
            </div>
            <div className="flex gap-[5px] items-center flex-wrap">
              <div className="bg-[#004aad] flex items-center justify-center p-[3px] rounded-[3px]">
                <p className="font-medium text-[5px] text-white">All Products (9)</p>
              </div>
              <div className="bg-[#f4f4f5] flex items-center justify-center px-[3px] py-[3px] rounded-[3px]">
                <p className="font-medium text-[#71717a] text-[5px]">In Stock (9)</p>
              </div>
              <div className="bg-[#f4f4f5] flex items-center justify-center px-[3px] py-[3px] rounded-[3px]">
                <p className="font-medium text-[#71717a] text-[5px]">Low Stock (0)</p>
              </div>
              <div className="bg-[#f4f4f5] flex items-center justify-center px-[3px] py-[3px] rounded-[3px]">
                <p className="font-medium text-[#71717a] text-[5px]">Out of Stock (0)</p>
              </div>
            </div>
            <div className="border-[0.3px] border-[#d9d9e0] border-solid flex gap-[3px] items-center pl-[6px] pr-[1px] py-[3px] rounded-[3px] w-[60px]">
              <p className="font-medium text-[#71717a] text-[5px]">All Categories</p>
              <svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2.5L3.5 4L5 2.5" stroke="#71717a" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          
          {/* Product Grid - Small Cards */}
          <div className="absolute flex gap-[8px] items-center left-[8px] top-[126px]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border-[0.3px] border-[#d9d9e0] border-solid flex flex-col gap-[6px] p-[6px] rounded-[5px] w-[90px]">
                <div className="bg-[#f4f4f5] flex items-center justify-center h-[52px] rounded-[5px] relative">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.5 2L14 5.5V11.5L8.5 15L3 11.5V5.5L8.5 2Z" stroke="#71717a" strokeWidth="1" fill="none"/>
                  </svg>
                  <div className="absolute bg-[#dbfce7] flex items-center justify-center left-[3px] px-[3px] py-[2px] rounded-[7px] top-[3px]">
                    <p className="font-semibold text-[#00a63e] text-[5px]">In Stock</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex flex-col gap-[2px]">
                    <p className="font-semibold text-[#09090b] text-[6px]">iPhone 16</p>
                    <p className="font-normal text-[#d9d9e0] text-[5px]">Gadgets</p>
                  </div>
                  <p className="font-normal text-[#d9d9e0] text-[5px]">SKU: 0354E3E2</p>
                </div>
                <div className="flex flex-col gap-[2px]">
                  <p className="font-semibold text-[#09090b] text-[7px]">Ksh 115,000</p>
                  <p className="font-normal text-[#d9d9e0] text-[4px]">Stock: 20 pcs</p>
                </div>
                <div className="border-t border-[#e2e2f0] flex items-center justify-between pt-[5px]">
                  <div className="flex gap-[1px] items-center">
                    <svg width="6" height="6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#004aad"/>
                    </svg>
                    <p className="font-medium text-[#004aad] text-[5px]">View Details</p>
                  </div>
                  <div className="flex gap-[6px] items-center">
                    <svg width="6" height="6" viewBox="0 0 24 24" fill="none"><path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="#71717a"/></svg>
                    <svg width="6" height="6" viewBox="0 0 24 24" fill="none"><path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#71717a"/></svg>
                    <svg width="6" height="6" viewBox="0 0 24 24" fill="none"><path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="#71717a"/></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Foreground Stock Card - positioned higher and centered */}
      <div className="absolute bg-white flex flex-col gap-[10px] left-[50%] translate-x-[-50%] lg:translate-x-0 lg:left-auto lg:right-[100px] p-[10px] rounded-[12px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.05)] top-[20px] lg:top-[30px] w-[207px]">
        {/* Image Area */}
        <div className="bg-[#f4f4f5] flex items-center justify-center h-[92px] rounded-[8px] relative w-full">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 3L26 9.5V20.5L15 27L4 20.5V9.5L15 3Z" stroke="#71717a" strokeWidth="1.5" fill="none"/>
          </svg>
          <div className="absolute bg-[#dbfce7] flex items-center justify-center left-[5px] px-[5px] py-[3px] rounded-[12px] top-[5px]">
            <p className="font-semibold text-[#00a63e] text-[8px]">In Stock</p>
          </div>
        </div>
        
        {/* Description */}
        <div className="flex items-end justify-between w-full">
          <div className="flex flex-col gap-[4px]">
            <p className="font-semibold text-[#09090b] text-[10px]">iPhone 16</p>
            <p className="font-normal text-[#71717a] text-[9px]">Gadgets</p>
          </div>
          <p className="font-normal text-[#71717a] text-[9px]">SKU: 0354E3E2</p>
        </div>
        
        {/* Price */}
        <div className="flex flex-col gap-[4px] w-full">
          <p className="font-semibold text-[#09090b] text-[12px]">Ksh 115,000</p>
          <p className="font-normal text-[#71717a] text-[7px]">Stock: 20 pcs</p>
        </div>
        
        {/* Action */}
        <div className="border-t border-[#e2e2f0] flex items-center justify-between pt-[8px] w-full">
          <div className="flex gap-[2px] items-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#004aad"/>
            </svg>
            <p className="font-medium text-[#004aad] text-[8px]">View Details</p>
          </div>
          <div className="flex gap-[10px] items-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="#71717a"/></svg>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#71717a"/></svg>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="#71717a"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
