const Permission = require('../models/Permission')

exports.checkTableauPermission = async (req, res, next) => {
  const tableauId = req.params.tableauId
  const userId = req.user.id // Assumant que l'utilisateur connecté est dans req.user

  const permission = await Permission.findOne({
    tableau: tableauId,
    user: userId,
  })

  if (!permission || !permission.read) {
    return res.status(403).json({ error: 'Accès refusé' })
  }

  next()
}
