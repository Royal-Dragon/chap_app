const Avatar = ({userId,username,online}) => {
  const colors = ['bg-teal-200', 'bg-red-200',
  'bg-green-200', 'bg-purple-200',
  'bg-blue-200', 'bg-yellow-200',
  'bg-orange-200', 'bg-pink-200', 'bg-fuchsia-200', 'bg-rose-200'];
   const userBase = parseInt(userId, 32)
   const circleColor = userBase % colors.length 
  return (
    <div className={'w-8 h-8  relative rounded-full '+colors[circleColor]}>
      <div className='text-center font-bold w-full opacity-70'>{username[0]} </div>
      {online&&(
        <div className="absolute w-3 h-3 bg-green-400 rounded-full bottom-0 right-0 border border-emerald-50"></div>
    
      )}
      {
        !online&&(
          <div className="absolute w-3 h-3 bg-gray-400 rounded-full bottom-0 right-0 border border-emerald-50">
          </div>
        )
      }
      </div>
    )
}

export default Avatar




