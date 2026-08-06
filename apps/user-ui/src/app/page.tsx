import React from 'react'
import Hero from '@/shared/modules/hero'
import SectionTitle from '@/shared/components/section/section-title'


const Page = () => {
  return (
    <div>
      <Hero/>
      <div className = "md:w-[80%] m-auto my-10 w-[90%]">
        <div className='mb-8'>
          <SectionTitle
          title = "Suggested Products"
          />
        </div>
        {
          <div className='grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5 '>
            {Array.from({length: 10}).map((_,index)=>(
              <div key = {index} className='h-[250px] bg-gray-300 animate-pulse rounded-xl'>

              </div>
            ))}
          </div>
        }
      </div>
    </div>
  )
}

export default Page
