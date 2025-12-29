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
  className?: string;
  bgColor?: string;
}

export function ProductCard({ title, description, children, imageSrc, className, bgColor = "bg-[#e6effc]" }: ProductCardProps) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-[32px] lg:rounded-[48px] min-h-[320px] lg:min-h-[380px] flex flex-col lg:flex-row", bgColor, className)}>
      {/* Text Content */}
      <div className="flex-1 flex flex-col justify-center gap-6 lg:gap-8 p-8 lg:p-12 z-10 lg:max-w-[45%]">
        <div className="flex flex-col gap-4 lg:gap-5">
          <h3 className="font-inter font-medium text-[28px] lg:text-[36px] leading-[1.15] tracking-[-0.5px] text-[#001031]">
            {title}
          </h3>
          <p className="font-inter font-normal text-[14px] lg:text-[15px] leading-[1.6] text-[#001031]/80 max-w-[400px]">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[#004aad] font-dm-sans font-semibold text-[14px] lg:text-[16px] cursor-pointer hover:gap-3 transition-all">
          Get Started
          <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
        </div>
      </div>
      
      {/* Mockup Image */}
      <div className="flex-1 relative min-h-[220px] lg:min-h-0">
        {children ? (
          <div className="absolute inset-0 lg:right-[-10%] flex items-center justify-center lg:justify-end">
            {children}
          </div>
        ) : imageSrc ? (
          <div className="absolute top-[15%] bottom-0 left-0 right-0 lg:left-auto lg:right-[-5%] lg:w-[100%]">
            <Image 
              src={imageSrc} 
              alt={title} 
              fill 
              className="object-contain object-bottom lg:object-right-bottom"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
