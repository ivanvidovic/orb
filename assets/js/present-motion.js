// Continuous speed easing: no timeout or hard restart after a gesture.
export function createPresentMotion(){
  let speed=1,recovery=1;
  return {
    reset(){speed=1;recovery=1;},
    interact(){recovery=0;},
    step(dt,held){
      if(held)recovery=0;
      else recovery=1-(1-recovery)*Math.exp(-dt/0.65);
      const target=recovery*recovery*(3-2*recovery);
      speed+=(target-speed)*(1-Math.exp(-dt/(held?0.18:0.55)));
      return speed;
    }
  };
}
