
const FRAMES_PER_SECOND = 20;

export default class Animator 
{

	static Toggle(target, animationInfo, callback)
	{
		window.currentAnimations = window.currentAnimations ?? [];
		let isReverse = (target.classList.contains(animationInfo.finishClass));
		this.StartAnimation(target, animationInfo, isReverse, callback);
	}

	static StartAnimation(target, animationInfo, isReverse, callback)
	{
		window.currentAnimations = window.currentAnimations ?? [];

		const milliseconds = animationInfo.seconds * 1000;
		const startTime = new Date().getTime();

		//This controls the transition function. At present only linear is supported. 
		//FUTURE FEATURE: add support for more transitions.
		const stepCount = animationInfo.seconds * FRAMES_PER_SECOND;
		const steps = animationInfo.steps || Animator.getLinearSteps(animationInfo.minValue, animationInfo.maxValue, stepCount, isReverse);
                
		const animation = {
			target: target,
			isReverse: isReverse,
			addClass: isReverse ?  animationInfo.startClass : animationInfo.finishClass,
			removeClass: isReverse ? animationInfo.finishClass: animationInfo.startClass,
			millisecondsPerStep: milliseconds / stepCount,
			startTime: startTime,
			endTime: startTime + milliseconds,
			style: animationInfo.style,
			units: animationInfo.units,
			steps: steps,
			callback: callback
		};
        
		if (animation.steps.length > 0)
		{
			window.currentAnimations.push(animation);
			requestAnimationFrame(Animator.OnAnimationFrame);
		} 
	}

	static getLinearSteps(from, to, steps, reverse)
	{
		const values = [];

		const start = Number.parseFloat(from);
		const end = Number.parseFloat(to);
		const increment = (end - start) / (steps - 1);

		if (Math.abs(increment) > 0)
		{
			for (let v = start; v <= end; v += increment)
			{
				values.push(v);
			}

			//last entry may have a rounding error. replace with actual end value
			values.pop();
			values.push(end);

			if (reverse)
			{
				values.reverse();
			}
		}

		return values;
	}

	static OnAnimationFrame()
	{
		const unfinishedAnimations = [];
		const currentTime = new Date().getTime();
		for (let animation of window.currentAnimations)
		{
			animation.target.classList.remove(animation.removeClass);
			const isFinished = (currentTime > animation.endTime);

			if (isFinished === false)
			{
				let elapsedMillseconds = currentTime - animation.startTime;
				let currentStep = Math.floor(elapsedMillseconds / animation.millisecondsPerStep);
				animation.target.style[animation.style] = animation.steps[currentStep] + animation.units;
				unfinishedAnimations.push(animation);
			}
			else
			{
				animation.target.classList.add(animation.addClass);
				if (animation.callback)
				{
					animation.callback(animation);
				}
			}
		} //each animation

		window.currentAnimations = unfinishedAnimations;

		if (window.currentAnimations.length > 0)
		{
			requestAnimationFrame(Animator.OnAnimationFrame);
		}
	}

	static async WaitForFrame() 
	{ 
		await new Promise(requestAnimationFrame); 
	}
}
