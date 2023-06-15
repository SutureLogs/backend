async function checkPermission(surgery) {
	const visibility = surgery.surgeryVisibility;

	let isPrivateAllowed = false;
	let isOrgAllowed = false;
	if (visibility === "private") {
		if (
			surgery.surgeryTeam.some(
				(obj) => obj.doctorId._id.toString() === userid
			)
		) {
			isPrivateAllowed = true;
		} else if (surgery.privateList.includes(userid)) {
			isPrivateAllowed = true;
		}
	}

	if (visibility === "organisation") {
		const askingUser = await Doctor.findById(userid);
		if (surgery.belongsTo.equals(askingUser.belongsTo)) {
			isOrgAllowed = true;
		}
	}

	if (visibility === "public" || isPrivateAllowed || isOrgAllowed) {
		return true;
	} else {
		return false;
	}
}
export default checkPermission;
