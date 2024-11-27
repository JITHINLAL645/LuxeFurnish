
import category from "../../models/categorySchema.js"


//Load Category Page Section
const load_CategoryPage = async (req, res) => {
    try {
        const catData = await category.find(); 
        console.log(catData);
        
        res.render('admin/category', { catData, title: 'Category Management' })
        /* if(req.session.isAdmin){
         
            res.render('admin/category',{catData,title:'Category Management'})
        } else{
         res.redirect('/admin/login')
        } */
    } catch (error) {
        console.error(error);
        res.status(500).json({ err: "something went wrong while adding new category" });
    }
}

// Add Category Section
const add_Category = async (req, res) => {
    try {
        const categoryName = req.body.name;
        const upperCaseName = categoryName.toUpperCase();
        const existCat = await category.findOne({ category_name: upperCaseName });
        const catData = await category.find()
        if (existCat) {
            return res.render('admin/categoryPage', {
                existCat: "This category is already exist",
                catData
            })
        }

        const newCategory = new category({
            category_name: categoryName
        });

        newCategory.save()
            .then(doc => console.log('Saved Category:', doc))
            .catch(err => console.error('Error:', err));


        res.redirect('/admin/categories')

    } catch (error) {
        console.log("error", error);
        res.status(500).json({ err: "something went wrong while adding new category" });
    }
}

//Edit Category Section
const edit_Category = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const upperCaseName = name.toUpperCase();
        const cateData = await category.findOne({ _id: id });
        if (!cateData) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        const existCat = await category.findOne({ category_name: upperCaseName });
        if (existCat && existCat._id.toString() !== id) {
            return res.status(400).json({ success: false, message: 'Category name already exists' });
        }
        cateData.category_name = upperCaseName;

        await cateData.save();

        res.status(200).json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, message: 'Failed to update category' });
    }
};


//Delete Category Section
const delete_Category = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
};


//Restore Category Setion
const restore_Category = async (req, res) => {
    try {
        const { id } = req.params;
        const Category = await category.findById(id);
        if (!Category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        if (!Category.isDeleted) {
            return res.status(400).json({ success: false, message: 'Category is not deleted' });
        }
        Category.isDeleted = false;
        await Category.save();
        res.status(200).json({ success: true, message: 'Category restored successfully' });
    } catch (error) {
        console.error('Error restoring category:', error);
        res.status(500).json({ success: false, message: 'Failed to restore category' });
    }
};



export {
    restore_Category,
    delete_Category,
    edit_Category,
    add_Category,
    load_CategoryPage,
}