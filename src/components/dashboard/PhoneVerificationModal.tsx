'use client'

import { useRouter } from 'next/navigation'

interface PhoneVerificationModalProps {
    isOpen: boolean
}

export function PhoneVerificationModal({ isOpen }: PhoneVerificationModalProps) {
    const router = useRouter()

    if (!isOpen) return null

    const handleVerifyClick = () => {
        router.push('/dashboard/verify-phone')
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[24px] p-[25px] w-full max-w-[637px] mx-4 flex flex-col gap-[30px] items-center justify-center shadow-xl">
                {/* Title Row */}
                <div className="flex items-center justify-between w-full max-w-[587px]">
                    <h2 className="font-inter font-semibold text-[#001031] text-[20px] sm:text-[24px] leading-[1]">
                        Quick Account Update
                    </h2>
                    <div className="h-[24px] w-[24px] flex items-center justify-center">
                        <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_1022_5785)">
                                <mask id="mask0_1022_5785" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="0" y="2" width="20" height="20">
                                    <path d="M9.99936 20.3337C11.0939 20.335 12.1779 20.1201 13.1892 19.7012C14.2004 19.2823 15.1189 18.6678 15.8919 17.8928C16.6668 17.1198 17.2813 16.2014 17.7002 15.1901C18.1191 14.1789 18.334 13.0949 18.3327 12.0003C18.334 10.9058 18.1191 9.82176 17.7002 8.81054C17.2813 7.79931 16.6668 6.88082 15.8919 6.10783C15.1189 5.3329 14.2004 4.71834 13.1892 4.29946C12.1779 3.88059 11.0939 3.66565 9.99936 3.667C8.90481 3.66565 7.82078 3.88059 6.80956 4.29946C5.79834 4.71834 4.87984 5.3329 4.10686 6.10783C3.33192 6.88082 2.71736 7.79931 2.29849 8.81054C1.87961 9.82176 1.66467 10.9058 1.66602 12.0003C1.66467 13.0949 1.87961 14.1789 2.29849 15.1901C2.71736 16.2014 3.33192 17.1198 4.10686 17.8928C4.87984 18.6678 5.79834 19.2823 6.80956 19.7012C7.82078 20.1201 8.90481 20.335 9.99936 20.3337Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                                    <path fillRule="evenodd" clipRule="evenodd" d="M9.9987 6.58398C10.275 6.58398 10.5399 6.69373 10.7353 6.88908C10.9306 7.08443 11.0404 7.34938 11.0404 7.62565C11.0404 7.90192 10.9306 8.16687 10.7353 8.36222C10.5399 8.55757 10.275 8.66732 9.9987 8.66732C9.72243 8.66732 9.45748 8.55757 9.26213 8.36222C9.06678 8.16687 8.95703 7.90192 8.95703 7.62565C8.95703 7.34938 9.06678 7.08443 9.26213 6.88908C9.45748 6.69373 9.72243 6.58398 9.9987 6.58398Z" fill="black" />
                                    <path d="M10.2083 16.1673V10.334H9.375M8.75 16.1673H11.6667" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </mask>
                                <g mask="url(#mask0_1022_5785)">
                                    <path d="M0 2H20V22H0V2Z" fill="#004AAD" />
                                </g>
                            </g>
                            <defs>
                                <clipPath id="clip0_1022_5785">
                                    <rect width="20" height="20" fill="white" transform="translate(0 2)" />
                                </clipPath>
                            </defs>
                        </svg>

                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-[28px] items-start w-full max-w-[590px]">
                    <p className="font-inter font-normal text-[#001031] text-[16px] sm:text-[20px] leading-[30px] w-full">
                        Please verify your phone number to help keep your account secure and ensure you receive important business alerts.
                    </p>

                    {/* Button Row */}
                    <div className="flex items-center w-full">
                        <button
                            onClick={handleVerifyClick}
                            className="bg-[#004aad] text-white font-dm-sans font-semibold text-[16px] px-[24px] py-[10px] rounded-[12px] hover:bg-[#003d8f] transition-colors"
                        >
                            Verify Phone Number
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
