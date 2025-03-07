const Star = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <div className='galaxy scrollbar-none'>
        <div className='nebula scrollbar-none'></div>
        <div className='star'></div>
        <div className='star'></div>
        <div className='star'></div>
        <div className='star'></div>
        <div className='star'></div>
        <div className='star'></div>
        <div className='star'></div>
        <div className='star'></div>
        <div className='star'></div>
        <div className='star'></div>
      </div>
    </div>
  );
};

export default Star;
