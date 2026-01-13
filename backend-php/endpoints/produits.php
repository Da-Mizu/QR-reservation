<?php
// Produits endpoints

// Helper: process uploaded image -> normalize to JPEG, resize to max WxH, return relative path or null
function processUploadedImage($file) {
    if (empty($file) || $file['error'] !== UPLOAD_ERR_OK) return null;

    $tmpName = $file['tmp_name'];
    $info = getimagesize($tmpName);
    if ($info === false) return null;

    $mime = $info['mime'];
    // create source image
    switch ($mime) {
        case 'image/jpeg':
        case 'image/jpg':
            $src = imagecreatefromjpeg($tmpName);
            break;
        case 'image/png':
            $src = imagecreatefrompng($tmpName);
            break;
        case 'image/gif':
            $src = imagecreatefromgif($tmpName);
            break;
        case 'image/webp':
            if (function_exists('imagecreatefromwebp')) {
                $src = imagecreatefromwebp($tmpName);
                break;
            }
            return null;
        default:
            return null;
    }

    if (!$src) return null;

    $maxW = 400;
    $maxH = 400;
    $w = imagesx($src);
    $h = imagesy($src);

    $scale = min($maxW / $w, $maxH / $h, 1);
    $nw = (int)($w * $scale);
    $nh = (int)($h * $scale);

    $dst = imagecreatetruecolor($nw, $nh);
    // preserve PNG transparency when copying (we will convert to JPG though)
    imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

    $uploadsDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);

    $targetName = time() . '_' . bin2hex(random_bytes(6)) . '.jpg';
    $targetPath = $uploadsDir . '/' . $targetName;

    // save as JPEG with quality 85
    $saved = imagejpeg($dst, $targetPath, 85);

    imagedestroy($src);
    imagedestroy($dst);

    if ($saved) {
        return 'backend-php/uploads/' . $targetName;
    }
    return null;
}

// GET /api/produits - Liste uniquement les produits disponibles (client-facing)
if ($method === 'GET' && !isset($parts[2])) {
    $stmt = $pdo->query('SELECT * FROM produits WHERE disponible = 1');
    respond($stmt->fetchAll());
}

// GET /api/produits/all - Liste tous les produits (admin)
if ($method === 'GET' && isset($parts[2]) && $parts[2] === 'all') {
    $stmt = $pdo->query('SELECT * FROM produits ORDER BY categorie, nom');
    respond($stmt->fetchAll());
}

// GET /api/produits/:id - Détails d'un produit
if ($method === 'GET' && isset($parts[2]) && is_numeric($parts[2])) {
    $stmt = $pdo->prepare('SELECT * FROM produits WHERE id = ?');
    $stmt->execute([$parts[2]]);
    $row = $stmt->fetch();
    if (!$row) respond(['error' => 'Produit non trouvé'], 404);
    respond($row);
}

// POST /api/produits - Créer un nouveau produit
if ($method === 'POST' && !isset($parts[2])) {
    // Support JSON and multipart/form-data (file upload)
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'multipart/form-data') !== false) {
        $input = $_POST;
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
    }

    if (empty($input['nom'])) {
        respond(['error' => 'Le nom est requis'], 400);
    }

    // determine restaurant_id: prefer provided value, otherwise default to 1
    $restaurant_id = isset($input['restaurant_id']) ? (int)$input['restaurant_id'] : 1;

    // handle file upload if present and normalize image
    $imagePath = null;
    if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        try {
            $imagePath = processUploadedImage($_FILES['image']);
        } catch (Throwable $e) {
            error_log('processUploadedImage threw: ' . $e->getMessage());
            $imagePath = null;
        }

        // If normalization failed (e.g. GD not available), fall back to saving original file
        if ($imagePath === null) {
            error_log('Image normalization failed, falling back to raw upload');
            $uploadsDir = __DIR__ . '/../uploads';
            if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);
            $tmpName = $_FILES['image']['tmp_name'];
            $origName = basename($_FILES['image']['name']);
            $safeName = preg_replace('/[^A-Za-z0-9._-]/', '_', $origName);
            $targetName = time() . '_' . $safeName;
            $targetPath = $uploadsDir . '/' . $targetName;
            if (move_uploaded_file($tmpName, $targetPath)) {
                $imagePath = 'backend-php/uploads/' . $targetName;
            } else {
                error_log('Fallback move_uploaded_file failed for create');
            }
        }
    }

    try {
        $stmt = $pdo->prepare('INSERT INTO produits (restaurant_id, nom, description, prix, categorie, disponible, image) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $restaurant_id,
            $input['nom'],
            $input['description'] ?? '',
            $input['prix'] ?? 0,
            $input['categorie'] ?? '',
            $input['disponible'] ?? 1,
            $imagePath
        ]);

        $id = $pdo->lastInsertId();
        respond(['success' => true, 'id' => $id], 201);
    } catch (PDOException $e) {
        error_log('produits POST error: ' . $e->getMessage());
        respond(['error' => 'Erreur serveur lors de la création du produit', 'detail' => $e->getMessage()], 500);
    }
}

// PUT /api/produits/:id - Modifier un produit
if ($method === 'PUT' && isset($parts[2]) && is_numeric($parts[2])) {
    // Support JSON and multipart/form-data (file upload)
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'multipart/form-data') !== false) {
        $input = $_POST;
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
    }
    $id = $parts[2];
    
    if (empty($input['nom'])) {
        respond(['error' => 'Le nom est requis'], 400);
    }
    
    $restaurant_id = isset($input['restaurant_id']) ? (int)$input['restaurant_id'] : 1;
    // handle file upload if present and normalize image
    $imagePath = null;
    if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $imagePath = processUploadedImage($_FILES['image']);
    }

    try {
        if ($imagePath !== null) {
            $stmt = $pdo->prepare('UPDATE produits SET restaurant_id = ?, nom = ?, description = ?, prix = ?, categorie = ?, disponible = ?, image = ? WHERE id = ?');
            $stmt->execute([
                $restaurant_id,
                $input['nom'],
                $input['description'] ?? '',
                $input['prix'] ?? 0,
                $input['categorie'] ?? '',
                $input['disponible'] ?? 1,
                $imagePath,
                $id
            ]);
        } else {
            $stmt = $pdo->prepare('UPDATE produits SET restaurant_id = ?, nom = ?, description = ?, prix = ?, categorie = ?, disponible = ? WHERE id = ?');
            $stmt->execute([
                $restaurant_id,
                $input['nom'],
                $input['description'] ?? '',
                $input['prix'] ?? 0,
                $input['categorie'] ?? '',
                $input['disponible'] ?? 1,
                $id
            ]);
        }

        respond(['success' => true]);
    } catch (PDOException $e) {
        error_log('produits UPDATE error: ' . $e->getMessage());
        respond(['error' => 'Erreur serveur lors de la mise à jour du produit', 'detail' => $e->getMessage()], 500);
    }
}

// POST /api/produits/:id - Modifier un produit (support upload from browsers that send multipart as POST)
if ($method === 'POST' && isset($parts[2]) && is_numeric($parts[2])) {
    // Support multipart/form-data updates
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'multipart/form-data') !== false) {
        $input = $_POST;
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
    }
    $id = $parts[2];

    if (empty($input['nom'])) {
        respond(['error' => 'Le nom est requis'], 400);
    }

    $restaurant_id = isset($input['restaurant_id']) ? (int)$input['restaurant_id'] : 1;

    // handle file upload if present
    $imagePath = null;
    if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadsDir = __DIR__ . '/../uploads';
        if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);

        $tmpName = $_FILES['image']['tmp_name'];
        $origName = basename($_FILES['image']['name']);
        $safeName = preg_replace('/[^A-Za-z0-9._-]/', '_', $origName);
        $targetName = time() . '_' . $safeName;
        $targetPath = $uploadsDir . '/' . $targetName;
        if (move_uploaded_file($tmpName, $targetPath)) {
            $imagePath = 'backend-php/uploads/' . $targetName;
        }
    }

    if ($imagePath !== null) {
        $stmt = $pdo->prepare('UPDATE produits SET restaurant_id = ?, nom = ?, description = ?, prix = ?, categorie = ?, disponible = ?, image = ? WHERE id = ?');
        $stmt->execute([
            $restaurant_id,
            $input['nom'],
            $input['description'] ?? '',
            $input['prix'] ?? 0,
            $input['categorie'] ?? '',
            $input['disponible'] ?? 1,
            $imagePath,
            $id
        ]);
    } else {
        $stmt = $pdo->prepare('UPDATE produits SET restaurant_id = ?, nom = ?, description = ?, prix = ?, categorie = ?, disponible = ? WHERE id = ?');
        $stmt->execute([
            $restaurant_id,
            $input['nom'],
            $input['description'] ?? '',
            $input['prix'] ?? 0,
            $input['categorie'] ?? '',
            $input['disponible'] ?? 1,
            $id
        ]);
    }

    respond(['success' => true]);
}

// PATCH /api/produits/:id/disponible - Toggle disponibilité
if ($method === 'PATCH' && isset($parts[2]) && isset($parts[3]) && $parts[3] === 'disponible') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $parts[2];
    
    $stmt = $pdo->prepare('UPDATE produits SET disponible = ? WHERE id = ?');
    $stmt->execute([
        $input['disponible'] ?? 1,
        $id
    ]);
    
    respond(['success' => true]);
}

// DELETE /api/produits/:id - Supprimer un produit
if ($method === 'DELETE' && isset($parts[2]) && is_numeric($parts[2])) {
    $id = $parts[2];
    
    $stmt = $pdo->prepare('DELETE FROM produits WHERE id = ?');
    $stmt->execute([$id]);
    
    respond(['success' => true]);
}
